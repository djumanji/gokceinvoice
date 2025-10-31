import "./config/env";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import Tokens from "csrf";
import { db } from "./db";
import { registerRoutes } from "./routes";
import { registerAuthRoutes } from "./auth-routes";
import { registerOAuthRoutes } from "./oauth";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./middleware/error.middleware";
import * as cron from "node-cron";
import { processScheduledInvoices } from "./services/invoice-scheduler.service";
import { processRecurringInvoices } from "./services/recurring-invoice.service";

const PgStore = connectPgSimple(session);

const app = express();
export let sessionMiddleware: any; // Export for Socket.IO

// CSRF protection setup
const tokens = new Tokens();

// Trust proxy - required for Replit and other cloud platforms
// This ensures rate limiting and sessions work correctly behind a proxy
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      // Allow WebAssembly evaluation needed by dotlottie player
      scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api-eu.mixpanel.com",
        "https://app.posthog.com",
        "https://us.i.posthog.com",
        "https://eu.i.posthog.com"
      ],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://r2cdn.perplexity.ai"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Disable CSP in development for Vite HMR
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Validate required environment variables
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET environment variable must be set');
  console.error('Generate a secure secret with: openssl rand -base64 32');
  process.exit(1);
}

// Session middleware with PostgreSQL store
const sessionStore = process.env.DATABASE_URL
  ? new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    })
  : undefined; // Will use MemoryStore fallback if no DATABASE_URL

// Health check for session store
if (sessionStore) {
  sessionStore.pruneSessions((err) => {
    if (err) {
      console.error('❌ Session store health check failed:', err.message);
      console.error('⚠️  Sessions may not persist correctly. Check DATABASE_URL and user_sessions table.');
      console.error('   Run migration: psql $DATABASE_URL -f migrations/018_add_user_sessions_table.sql');
    } else {
      console.log('✅ Session store connected successfully (PostgreSQL)');
    }
  });
} else {
  console.warn('⚠️  WARNING: Using in-memory session store. Sessions will be lost on server restart.');
  console.warn('   Set DATABASE_URL environment variable to enable persistent sessions.');
}

sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Always secure in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // More lenient in development
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  },
  store: sessionStore,
  // Force session save on every response to ensure persistence
  rolling: true, // Reset maxAge on every request
});

app.use(sessionMiddleware);

app.use(cookieParser());
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// CSRF token endpoint - must be before auth routes
app.get('/api/csrf-token', (req, res) => {
  // Generate or retrieve CSRF secret for this session
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }
  const token = tokens.create(req.session.csrfSecret);
  res.json({ csrfToken: token });
});

// CSRF validation middleware
export function validateCsrf(req: Request | any, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for valid JWT token-based requests (mobile app)
  // Note: JWT validation will happen in the auth middleware
  // We just check if it's a JWT request here, but don't bypass security completely
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // For JWT requests, we rely on the JWT validation in auth middleware
    // CSRF is not applicable for stateless JWT auth
    return next();
  }

  // For session-based requests, require CSRF token
  const token = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  const secret = req.session.csrfSecret;

  if (!secret) {
    console.warn('[CSRF] Rejected: missing session secret', {
      path: req.path,
      method: req.method,
      hasToken: Boolean(token),
      hasSession: Boolean(req.session),
      sessionId: req.sessionID,
    });
    return res.status(403).json({ error: 'CSRF secret not found. Please refresh.' });
  }

  if (!token || typeof token !== 'string') {
    console.warn('[CSRF] Rejected: missing/invalid token header', {
      path: req.path,
      method: req.method,
      hasToken: Boolean(token),
    });
    return res.status(403).json({ error: 'CSRF token required' });
  }

  if (!tokens.verify(secret, token)) {
    console.warn('[CSRF] Rejected: token verification failed', {
      path: req.path,
      method: req.method,
    });
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

// Auth routes
registerAuthRoutes(app);
registerOAuthRoutes(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize Socket.IO for real-time messaging
  const { setupSocketIO } = await import('./socket/index.js');
  setupSocketIO(server, sessionMiddleware);

  // Use centralized error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Set up cron job for processing scheduled invoices every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled invoice processing...');
    try {
      const results = await processScheduledInvoices();
      if (results.processed > 0) {
        console.log(`[Cron] Processed ${results.processed} scheduled invoices: ${results.sent} sent, ${results.errors} errors`);
      }
    } catch (error) {
      console.error('[Cron] Error processing scheduled invoices:', error);
    }
  });

  console.log('[Cron] Scheduled invoice processing job started (runs every hour)');

  // Set up cron job for processing recurring invoices daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running recurring invoice processing...');
    try {
      const results = await processRecurringInvoices();
      if (results.processed > 0) {
        console.log(`[Cron] Processed ${results.processed} recurring invoices: ${results.generated} generated, ${results.errors} errors`);
      }
    } catch (error) {
      console.error('[Cron] Error processing recurring invoices:', error);
    }
  });

  console.log('[Cron] Recurring invoice processing job started (runs daily at midnight)');

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
