import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validateCsrf } from "./index";
import multer from "multer";
import { requireAuth } from "./middleware/auth.middleware";
import { sanitizeBody, SanitizationFields } from "./middleware/sanitization.middleware";
import { escapeHtml } from "./sanitize";
import {
  clientController,
  invoiceController,
  serviceController,
  expenseController,
  bankController,
  projectController,
  userController,
  uploadController,
  chatbotController,
  recurringInvoiceController,
} from "./controllers";

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: 'Too many upload attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply auth and CSRF middleware to all API routes
  app.use("/api/clients", requireAuth, validateCsrf);
  app.use("/api/invoices", requireAuth, validateCsrf);
  app.use("/api/services", requireAuth, validateCsrf);
  app.use("/api/expenses", requireAuth, validateCsrf);
  app.use("/api/users", requireAuth, validateCsrf);
  app.use("/api/bank-accounts", requireAuth, validateCsrf);
  app.use("/api/projects", requireAuth, validateCsrf);
  app.use("/api/recurring-invoices", requireAuth, validateCsrf);

  // Public Chatbot routes (no auth, no CSRF for MVP)
  const sessionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many chatbot sessions from this IP, please try again later',
  });
  const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many chatbot messages, slow down and try again',
  });
  const createSessionSchema = z.object({
    categorySlug: z.string().trim().min(1).max(50).optional(),
    sessionId: z.string().trim().min(10).max(128).optional(), // resume support
  });

  app.post("/api/chatbot/sessions", sessionLimiter, async (req, res) => {
    try {
      const { categorySlug, sessionId } = createSessionSchema.parse(req.body ?? {});
      const { createChatbotSession, findCategoryIdBySlug, getChatbotSessionByPublicId } = await import('./services/chatbot');

      // Resume if sessionId provided and exists
      if (sessionId) {
        const existing = await getChatbotSessionByPublicId(sessionId);
        if (existing) {
          console.log(`[chatbot] resume session ${existing.session_id}`);
          return res.status(200).json({
            sessionId: existing.session_id,
            phase: existing.phase,
            categoryId: existing.category_id,
            createdAt: existing.created_at,
            resumed: true,
          });
        }
      }

      let categoryId: string | null = null;
      if (categorySlug) {
        categoryId = await findCategoryIdBySlug(categorySlug);
      }

      const created = await createChatbotSession({ categoryId });
      console.log(`[chatbot] created session ${created.session_id}`);
      return res.status(201).json({
        sessionId: created.session_id,
        phase: created.phase,
        categoryId: created.category_id,
        createdAt: created.created_at,
        resumed: false,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create/resume chatbot session:", error);
      return res.status(500).json({ error: "Failed to create session" });
    }
  });

  const postMessageSchema = z.object({
    sessionId: z.string().trim().min(10).max(128),
    message: z.string().trim().min(1).max(5000),
  });

  app.post("/api/chatbot/messages", messageLimiter, async (req, res) => {
    try {
      const { sessionId, message } = postMessageSchema.parse(req.body ?? {});
      const { getChatbotSessionByPublicId, insertChatbotMessage, incrementSessionCounters } = await import('./services/chatbot');
      const { extractLeadFieldsViaLLM } = await import('./services/llm');

      const session = await getChatbotSessionByPublicId(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Record user message
      await insertChatbotMessage({ sessionRowId: session.id, role: 'user', content: message });
      await incrementSessionCounters(session.id, { user: 1 });
      console.log(`[chatbot] user message in ${session.session_id}`);

      // Extract fields and craft assistant reply (LLM or stub)
      const { assistantMessage, extractedFields, confidence } = await extractLeadFieldsViaLLM(message, {});

      await insertChatbotMessage({ sessionRowId: session.id, role: 'assistant', content: assistantMessage, extractedFields });
      await incrementSessionCounters(session.id, { assistant: 1 });
      console.log(`[chatbot] assistant reply in ${session.session_id}`);

      return res.status(200).json({
        assistantMessage,
        extractedFields,
        extractionConfidence: confidence,
        phase: session.phase, // remains same for stub
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Failed to handle chatbot message:', error);
      return res.status(500).json({ error: 'Failed to handle message' });
    }
  });

  const confirmSchema = z.object({
    customer_name: z.string().min(1).max(255),
    customer_email: z.string().email(),
    customer_phone: z.string().min(7).max(20),
    customer_zip_code: z.string().min(3).max(10),
    title: z.string().min(1).max(255),
    description: z.string().min(1).max(5000),
    budget_min: z.number().nonnegative().optional(),
    budget_max: z.number().nonnegative().optional(),
    urgency_level: z.enum(['low','medium','high','urgent']).optional(),
    service_area_radius_km: z.number().int().nonnegative().optional(),
    category_id: z.string().uuid().optional(),
  });

  app.post('/api/chatbot/sessions/:sessionId/confirm', async (req, res) => {
    try {
      const body = confirmSchema.parse(req.body ?? {});
      const { sessionId } = req.params;
      const { getChatbotSessionByPublicId } = await import('./services/chatbot');
      const session = await getChatbotSessionByPublicId(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      const { sendLeadConfirmationEmail } = await import('./services/email-service');

      // 1) Upsert user by email
      const userResult = await db.execute(sql<{ id: string }>`
        WITH existing AS (
          SELECT id FROM users WHERE email = ${body.customer_email} LIMIT 1
        ), inserted AS (
          INSERT INTO users (email, name, phone, created_at, updated_at)
          SELECT ${body.customer_email}, ${body.customer_name}, ${body.customer_phone}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM existing)
          RETURNING id
        )
        SELECT id FROM inserted
        UNION ALL
        SELECT id FROM existing
        LIMIT 1;
      `);
      // @ts-ignore
      const userId = ((userResult as any).rows?.[0] || (userResult as any)[0])?.id as string;

      // 2) Create lead
      const leadResult = await db.execute(sql<{ id: string }>`
        INSERT INTO leads (
          category_id, title, description, customer_name, customer_email, customer_phone,
          customer_zip_code, budget_min, budget_max, urgency_level, service_area_radius_km,
          lead_source, base_lead_cost, status, bidding_closes_at, metadata, is_qualified,
          chatbot_session_id, original_conversation, extraction_confidence
        ) VALUES (
          ${body.category_id ?? session.category_id},
          ${body.title},
          ${body.description},
          ${body.customer_name},
          ${body.customer_email},
          ${body.customer_phone},
          ${body.customer_zip_code},
          ${body.budget_min ?? null},
          ${body.budget_max ?? null},
          ${body.urgency_level ?? 'medium'},
          ${body.service_area_radius_km ?? null},
          'chatbot',
          0.00,
          'CREATED',
          NULL,
          NULL,
          TRUE,
          ${session.id}::uuid,
          NULL,
          0.5
        )
        RETURNING id;
      `);
      // @ts-ignore
      const leadId = ((leadResult as any).rows?.[0] || (leadResult as any)[0])?.id as string;

      // 3) Update session linkage and phase
      await db.execute(sql`UPDATE chatbot_sessions SET created_lead_id = ${leadId}, phase = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ${session.id}::uuid`);

      // 4) Send confirmation email (best-effort)
      try {
        // Sanitize user input to prevent XSS attacks
        const safeTitle = escapeHtml(body.title);
        const safeDescription = escapeHtml(body.description);
        const safeZip = escapeHtml(body.customer_zip_code);
        
        const summaryHtml = `
          <ul style="margin:0; padding-left:16px;">
            <li><strong>Title:</strong> ${safeTitle}</li>
            <li><strong>Description:</strong> ${safeDescription}</li>
            <li><strong>ZIP:</strong> ${safeZip}</li>
          </ul>`;
        const url = `${process.env.APP_DOMAIN || 'http://localhost:3000'}/verify-email`;
        await sendLeadConfirmationEmail({ email: body.customer_email, customerName: body.customer_name, summaryHtml, confirmationUrl: url });
      } catch (e) {
        // non-fatal
        console.warn('sendVerificationEmail failed:', e);
      }

      return res.status(201).json({ leadId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Failed to confirm chatbot session:', error);
      return res.status(500).json({ error: 'Failed to confirm session' });
    }
  });

  // ============================================================================
  // CHATBOT ROUTES (Public - no auth, no CSRF for MVP)
  // ============================================================================
  app.post("/api/chatbot/sessions", chatbotController.sessionLimiter, chatbotController.createSession);
  app.post("/api/chatbot/messages", chatbotController.messageLimiter, chatbotController.postMessage);
  app.post('/api/chatbot/sessions/:sessionId/confirm', chatbotController.confirmSession);

  // ============================================================================
  // USER PROFILE ROUTES
  // ============================================================================
  app.patch(
    "/api/users/profile",
    sanitizeBody(SanitizationFields.user),
    userController.updateProfile
  );

  // ============================================================================
  // CLIENT ROUTES
  // ============================================================================
  app.get("/api/clients", clientController.list);
  app.get("/api/clients/:id", clientController.getOne);
  app.post(
    "/api/clients",
    sanitizeBody(SanitizationFields.client),
    clientController.create
  );
  app.patch(
    "/api/clients/:id",
    sanitizeBody(SanitizationFields.client),
    clientController.update
  );
  app.delete("/api/clients/:id", clientController.remove);

  // ============================================================================
  // PROJECT ROUTES
  // ============================================================================
  app.get("/api/clients/:clientId/projects", projectController.listByClient);
  app.get("/api/projects/:id", projectController.getOne);
  app.post(
    "/api/projects",
    sanitizeBody(SanitizationFields.project),
    projectController.create
  );
  app.patch(
    "/api/projects/:id",
    sanitizeBody(SanitizationFields.project),
    projectController.update
  );
  app.delete("/api/projects/:id", projectController.remove);

  // ============================================================================
  // INVOICE ROUTES
  // ============================================================================
  app.get("/api/invoices", invoiceController.list);
  app.get("/api/invoices/:id", invoiceController.getOne);
  app.post(
    "/api/invoices",
    sanitizeBody([...SanitizationFields.invoice, ...SanitizationFields.lineItem]),
    invoiceController.create
  );
  app.patch(
    "/api/invoices/:id",
    sanitizeBody([...SanitizationFields.invoice, ...SanitizationFields.lineItem]),
    invoiceController.update
  );
  app.delete("/api/invoices/:id", invoiceController.remove);

  // Line item routes
  app.get("/api/invoices/:invoiceId/line-items", invoiceController.listLineItems);

  // Manual trigger for processing scheduled invoices (admin/testing)
  app.post("/api/invoices/process-scheduled", invoiceController.processScheduled);

  // Bulk invoice creation
  app.post(
    "/api/invoices/bulk",
    sanitizeBody([...SanitizationFields.invoice, ...SanitizationFields.lineItem]),
    invoiceController.createBulk
  );

  // Payment routes for invoices
  app.get("/api/invoices/:invoiceId/payments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { invoiceId } = req.params;

      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId, req.session.userId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const payments = await storage.getPaymentsByInvoice(invoiceId);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/invoices/:invoiceId/payments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { invoiceId } = req.params;

      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId, req.session.userId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Validate payment data
      const { insertPaymentSchema } = await import("@shared/schema");
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        invoiceId,
      });

      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid payment data", details: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/invoices/:invoiceId/payments/:paymentId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { invoiceId, paymentId } = req.params;

      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId, req.session.userId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Verify payment exists and belongs to this invoice
      const payment = await storage.getPayment(paymentId);
      if (!payment || payment.invoiceId !== invoiceId) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const success = await storage.deletePayment(paymentId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete payment" });
      }
    } catch (error) {
      next(error);
    }
  });

  // ============================================================================
  // RECURRING INVOICE ROUTES
  // ============================================================================
  app.get("/api/recurring-invoices", recurringInvoiceController.list);
  app.get("/api/recurring-invoices/:id", recurringInvoiceController.getOne);
  app.post(
    "/api/recurring-invoices",
    sanitizeBody([...SanitizationFields.invoice, ...SanitizationFields.lineItem]),
    recurringInvoiceController.create
  );
  app.patch(
    "/api/recurring-invoices/:id",
    sanitizeBody([...SanitizationFields.invoice, ...SanitizationFields.lineItem]),
    recurringInvoiceController.update
  );
  app.delete("/api/recurring-invoices/:id", recurringInvoiceController.remove);
  app.post("/api/recurring-invoices/:id/pause", recurringInvoiceController.pause);
  app.post("/api/recurring-invoices/:id/resume", recurringInvoiceController.resume);
  app.post("/api/recurring-invoices/:id/generate", recurringInvoiceController.generate);

  // ============================================================================
  // SERVICE ROUTES
  // ============================================================================
  app.get("/api/services", serviceController.list);
  app.get("/api/services/:id", serviceController.getOne);
  app.post(
    "/api/services",
    sanitizeBody(SanitizationFields.service),
    serviceController.create
  );
  app.patch(
    "/api/services/:id",
    sanitizeBody(SanitizationFields.service),
    serviceController.update
  );
  app.delete("/api/services/:id", serviceController.remove);

  // ============================================================================
  // EXPENSE ROUTES
  // ============================================================================
  app.get("/api/expenses", expenseController.list);
  app.get("/api/expenses/analytics", expenseController.getAnalytics);
  app.get("/api/expenses/:id", expenseController.getOne);
  app.post(
    "/api/expenses",
    sanitizeBody(SanitizationFields.expense),
    expenseController.create
  );
  app.patch(
    "/api/expenses/:id",
    sanitizeBody(SanitizationFields.expense),
    expenseController.update
  );
  app.delete("/api/expenses/:id", expenseController.remove);

  // ============================================================================
  // BANK ACCOUNT ROUTES
  // ============================================================================
  app.get("/api/bank-accounts", bankController.list);
  app.get("/api/bank-accounts/:id", bankController.getOne);
  app.post(
    "/api/bank-accounts",
    sanitizeBody(SanitizationFields.bankAccount),
    bankController.create
  );
  app.patch(
    "/api/bank-accounts/:id",
    sanitizeBody(SanitizationFields.bankAccount),
    bankController.update
  );
  app.delete("/api/bank-accounts/:id", bankController.remove);
  app.post("/api/bank-accounts/:id/set-default", bankController.setDefault);

  // ============================================================================
  // FILE UPLOAD ROUTES
  // ============================================================================
  app.get("/api/uploads/:filename", uploadController.serveFile);
  app.post(
    "/api/upload",
    uploadLimiter,
    upload.single('file'),
    uploadController.uploadFile
  );
  app.post(
    "/api/upload/company-logo",
    uploadLimiter,
    upload.single('logo'),
    uploadController.uploadLogo
  );

  const httpServer = createServer(app);
  return httpServer;
}
