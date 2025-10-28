import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { requireAuth } from "./middleware";
import { validateCsrf } from "./index";
import { insertClientSchema, insertInvoiceSchema, insertLineItemSchema, insertServiceSchema, insertExpenseSchema, updateUserProfileSchema, bankAccountSchema } from "@shared/schema";
import { z } from "zod";
import { sanitizeObject } from "./sanitize";
import multer from "multer";
import { uploadToS3, deleteFromS3, extractS3KeyFromUrl } from "./services/s3-service";

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

  // User profile routes
  app.patch("/api/users/profile", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs to prevent XSS
      const sanitized = sanitizeObject(req.body, ['name', 'companyName', 'address', 'phone', 'taxOfficeId']);

      const data = updateUserProfileSchema.parse(sanitized);
      const user = await storage.updateUser(userId, data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update user profile:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  
  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const client = await storage.getClient(req.params.id, userId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Failed to fetch client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs to prevent XSS
      const sanitized = sanitizeObject(req.body, ['name', 'company', 'address', 'notes', 'taxId']);

      const data = insertClientSchema.parse({ ...sanitized, userId });
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create client:", error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs to prevent XSS
      const sanitized = sanitizeObject(req.body, ['name', 'company', 'address', 'notes', 'taxId']);

      const data = insertClientSchema.partial().parse(sanitized);
      const client = await storage.updateClient(req.params.id, userId, data);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update client:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const deleted = await storage.deleteClient(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const invoice = await storage.getInvoice(req.params.id, userId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { lineItems, taxRate, ...invoiceData } = req.body;

      // Sanitize invoice text fields
      const sanitizedInvoice = sanitizeObject(invoiceData, ['notes', 'orderNumber', 'projectNumber', 'forProject']);

      // Validate and parse line items
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ error: "At least one line item is required" });
      }

      // Sanitize line item descriptions
      const sanitizedLineItems = lineItems.map(item =>
        sanitizeObject(item, ['description'])
      );

      // SERVER-SIDE CALCULATION - Don't trust client
      const subtotal = sanitizedLineItems.reduce((sum: number, item: any) => {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.price);
        if (isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
          throw new Error("Invalid quantity or price in line items");
        }
        return sum + (qty * price);
      }, 0);

      const taxRateNum = parseFloat(taxRate) || 0;
      if (taxRateNum < 0 || taxRateNum > 100) {
        return res.status(400).json({ error: "Tax rate must be between 0 and 100" });
      }

      const tax = subtotal * (taxRateNum / 100);
      const total = subtotal + tax;

      // Validate against client-provided values (within rounding tolerance)
      const clientTotal = parseFloat(invoiceData.total);
      if (Math.abs(total - clientTotal) > 0.02) {
        return res.status(400).json({
          error: "Total mismatch - calculation error detected",
          expected: total.toFixed(2),
          received: clientTotal.toFixed(2)
        });
      }

      // Generate invoice number server-side
      const invoiceNumber = await storage.getNextInvoiceNumber(userId);

      // Validate and create invoice
      const validatedInvoice = insertInvoiceSchema.parse({
        ...sanitizedInvoice,
        userId,
        invoiceNumber,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        taxRate: taxRateNum.toString(),
        total: total.toFixed(2),
      });

      // Create invoice
      const invoice = await storage.createInvoice(validatedInvoice);

      // Create line items
      for (const item of sanitizedLineItems) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.price);
        const amount = qty * price;

        const validatedItem = insertLineItemSchema.parse({
          invoiceId: invoice.id,
          description: item.description,
          quantity: qty.toString(),
          price: price.toFixed(2),
          amount: amount.toFixed(2),
        });
        await storage.createLineItem(validatedItem);
      }

      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error) {
        console.error("Failed to create invoice:", error);
        return res.status(400).json({ error: error.message });
      }
      console.error("Failed to create invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { lineItems, taxRate, ...invoiceData } = req.body;

      // Check if invoice exists and belongs to user
      const existingInvoice = await storage.getInvoice(req.params.id, userId);
      if (!existingInvoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Prevent changing invoice number
      if (invoiceData.invoiceNumber && invoiceData.invoiceNumber !== existingInvoice.invoiceNumber) {
        return res.status(400).json({ error: "Cannot change invoice number" });
      }

      // If line items are provided, recalculate totals server-side
      if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
        const subtotal = lineItems.reduce((sum: number, item: any) => {
          const qty = parseFloat(item.quantity);
          const price = parseFloat(item.price);
          if (isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
            throw new Error("Invalid quantity or price in line items");
          }
          return sum + (qty * price);
        }, 0);

        const taxRateNum = parseFloat(taxRate) || 0;
        if (taxRateNum < 0 || taxRateNum > 100) {
          return res.status(400).json({ error: "Tax rate must be between 0 and 100" });
        }

        const tax = subtotal * (taxRateNum / 100);
        const total = subtotal + tax;

        // Update invoice with recalculated values
        const data = insertInvoiceSchema.partial().parse({
          ...invoiceData,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          taxRate: taxRateNum.toString(),
          total: total.toFixed(2),
        });

        const invoice = await storage.updateInvoice(req.params.id, userId, data);

        if (!invoice) {
          return res.status(404).json({ error: "Invoice not found" });
        }

        // Delete existing line items and create new ones
        await storage.deleteLineItemsByInvoice(req.params.id);

        for (const item of lineItems) {
          const qty = parseFloat(item.quantity);
          const price = parseFloat(item.price);
          const amount = qty * price;

          const validatedItem = insertLineItemSchema.parse({
            invoiceId: invoice.id,
            description: item.description,
            quantity: qty.toString(),
            price: price.toFixed(2),
            amount: amount.toFixed(2),
          });
          await storage.createLineItem(validatedItem);
        }

        res.json(invoice);
      } else {
        // Update invoice without line items (e.g., status change)
        const data = insertInvoiceSchema.partial().parse(invoiceData);
        const invoice = await storage.updateInvoice(req.params.id, userId, data);

        if (!invoice) {
          return res.status(404).json({ error: "Invoice not found" });
        }

        res.json(invoice);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error) {
        console.error("Failed to update invoice:", error);
        return res.status(400).json({ error: error.message });
      }
      console.error("Failed to update invoice:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const deleted = await storage.deleteInvoice(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Line item routes
  app.get("/api/invoices/:invoiceId/line-items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(req.params.invoiceId, userId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const lineItems = await storage.getLineItemsByInvoice(req.params.invoiceId);
      res.json(lineItems);
    } catch (error) {
      console.error("Failed to fetch line items:", error);
      res.status(500).json({ error: "Failed to fetch line items" });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const services = await storage.getServices(userId);
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const service = await storage.getService(req.params.id, userId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Failed to fetch service:", error);
      res.status(500).json({ error: "Failed to fetch service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs to prevent XSS
      const sanitized = sanitizeObject(req.body, ['name', 'description', 'category']);

      const data = insertServiceSchema.parse({ ...sanitized, userId });
      const service = await storage.createService(data);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create service:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs to prevent XSS
      const sanitized = sanitizeObject(req.body, ['name', 'description', 'category']);

      const data = insertServiceSchema.partial().parse(sanitized);
      const service = await storage.updateService(req.params.id, userId, data);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update service:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const deleted = await storage.deleteService(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete service:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // File upload route
  app.post("/api/upload", requireAuth, uploadLimiter, upload.single('file'), async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { url, key } = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        userId,
        req.file.mimetype
      );

      res.json({ url, key });
    } catch (error) {
      console.error("Failed to upload file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const expenses = await storage.getExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const expense = await storage.getExpense(req.params.id, userId);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Failed to fetch expense:", error);
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs to prevent XSS
      const sanitized = sanitizeObject(req.body, ['description', 'category', 'vendor', 'receipt', 'tags']);

      const data = insertExpenseSchema.parse({ ...sanitized, userId });
      const expense = await storage.createExpense(data);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs to prevent XSS
      const sanitized = sanitizeObject(req.body, ['description', 'category', 'vendor', 'receipt', 'tags']);

      const data = insertExpenseSchema.partial().parse(sanitized);
      const expense = await storage.updateExpense(req.params.id, userId, data);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the expense first to check if it has a receipt
      const expense = await storage.getExpense(req.params.id, userId);
      
      const deleted = await storage.deleteExpense(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Expense not found" });
      }

      // Clean up the S3 file if it exists
      if (expense?.receipt) {
        try {
          const key = extractS3KeyFromUrl(expense.receipt);
          if (key) {
            await deleteFromS3(key);
          }
        } catch (error) {
          console.error("Failed to delete S3 file:", error);
          // Don't fail the expense deletion if S3 cleanup fails
        }
      }

      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Bank Account routes
  app.get("/api/bank-accounts", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const bankAccounts = await storage.getBankAccounts(userId);
      res.json(bankAccounts);
    } catch (error) {
      console.error("Failed to fetch bank accounts:", error);
      res.status(500).json({ error: "Failed to fetch bank accounts" });
    }
  });

  app.get("/api/bank-accounts/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const bankAccount = await storage.getBankAccount(req.params.id, userId);
      if (!bankAccount) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      res.json(bankAccount);
    } catch (error) {
      console.error("Failed to fetch bank account:", error);
      res.status(500).json({ error: "Failed to fetch bank account" });
    }
  });

  app.post("/api/bank-accounts", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs
      const sanitized = sanitizeObject(req.body, ['accountHolderName', 'bankName', 'accountNumber', 'iban', 'swiftCode', 'bankAddress', 'bankBranch']);

      const data = bankAccountSchema.parse(sanitized);
      const bankAccount = await storage.createBankAccount(userId, data);
      res.status(201).json(bankAccount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create bank account:", error);
      res.status(500).json({ error: "Failed to create bank account" });
    }
  });

  app.patch("/api/bank-accounts/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Sanitize text inputs
      const sanitized = sanitizeObject(req.body, ['accountHolderName', 'bankName', 'accountNumber', 'iban', 'swiftCode', 'bankAddress', 'bankBranch']);

      const data = bankAccountSchema.partial().parse(sanitized);
      const bankAccount = await storage.updateBankAccount(req.params.id, userId, data);
      if (!bankAccount) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      res.json(bankAccount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update bank account:", error);
      res.status(500).json({ error: "Failed to update bank account" });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const deleted = await storage.deleteBankAccount(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete bank account:", error);
      res.status(500).json({ error: "Failed to delete bank account" });
    }
  });

  app.post("/api/bank-accounts/:id/set-default", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await storage.setDefaultBankAccount(req.params.id, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to set default bank account:", error);
      res.status(500).json({ error: "Failed to set default bank account" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
