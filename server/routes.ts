import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { validateCsrf } from "./index";
import multer from "multer";
import { requireAuth } from "./middleware/auth.middleware";
import { sanitizeBody, SanitizationFields } from "./middleware/sanitization.middleware";
import {
  clientController,
  invoiceController,
  serviceController,
  expenseController,
  bankController,
  projectController,
  userController,
  uploadController,
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
