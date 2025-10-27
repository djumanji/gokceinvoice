import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middleware";
import { insertClientSchema, insertInvoiceSchema, insertLineItemSchema, insertServiceSchema } from "@shared/schema";
import { z } from "zod";
import { sanitizeObject } from "./sanitize";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply auth middleware to all API routes
  app.use("/api/clients", requireAuth);
  app.use("/api/invoices", requireAuth);
  app.use("/api/services", requireAuth);
  
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
  app.get("/api/invoices/:invoiceId/line-items", async (req, res) => {
    try {
      const lineItems = await storage.getLineItemsByInvoice(req.params.invoiceId);
      res.json(lineItems);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
