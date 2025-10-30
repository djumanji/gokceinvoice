import type { Request, Response } from 'express';
import { storage } from '../storage';
import { insertInvoiceSchema, insertLineItemSchema } from '@shared/schema';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';
import {
  calculateInvoiceTotals,
  validateTotalMatch,
  prepareLineItems
} from '../services/invoice-calculation.service';
import { processScheduledInvoices } from '../services/invoice-scheduler.service';

/**
 * Invoice Controller
 * Handles CRUD operations for invoices and line items
 */

/**
 * GET /api/invoices
 * Get all invoices for the authenticated user
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const invoices = await storage.getInvoices(userId);
  res.json(invoices);
});

/**
 * GET /api/invoices/:id
 * Get a specific invoice by ID
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const invoice = await storage.getInvoice(id, userId);
  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  res.json(invoice);
});

/**
 * POST /api/invoices
 * Create a new invoice with line items
 * Body is validated and sanitized by middleware before reaching here
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { lineItems, taxRate, ...invoiceData } = req.body;

  // Calculate totals server-side (never trust client)
  const calculations = calculateInvoiceTotals(lineItems, taxRate);
  
  // Validate client-provided total matches server calculation
  if (invoiceData.total) {
    validateTotalMatch(calculations.total, invoiceData.total);
  }

  // Generate invoice number server-side
  const invoiceNumber = await storage.getNextInvoiceNumber(userId);

  // Determine status based on scheduledDate
  let status = "draft";
  if (invoiceData.scheduledDate) {
    const scheduledDate = new Date(invoiceData.scheduledDate);
    const now = new Date();
    if (scheduledDate > now) {
      status = "scheduled";
    }
  }

  // Prepare invoice data with calculated values
  const validatedInvoice = insertInvoiceSchema.parse({
    ...invoiceData,
    userId,
    invoiceNumber,
    status,
    subtotal: calculations.subtotal,
    tax: calculations.tax,
    taxRate: taxRate.toString(),
    total: calculations.total,
  });

  // Prepare line items
  const preparedLineItems = prepareLineItems(lineItems);

  // Create invoice with line items in transaction
  const invoice = await storage.createInvoiceWithLineItems(
    validatedInvoice,
    preparedLineItems
  );

  res.status(201).json(invoice);
});

/**
 * PATCH /api/invoices/:id
 * Update an existing invoice and optionally its line items
 * Body is validated and sanitized by middleware before reaching here
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { lineItems, taxRate, ...invoiceData } = req.body;

  // Check if invoice exists and belongs to user
  const existingInvoice = await storage.getInvoice(id, userId);
  if (!existingInvoice) {
    throw new AppError(404, 'Invoice not found');
  }

  // Prevent changing invoice number
  if (invoiceData.invoiceNumber && invoiceData.invoiceNumber !== existingInvoice.invoiceNumber) {
    throw new AppError(400, 'Cannot change invoice number');
  }

  // If line items are provided, recalculate totals
  if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
    const calculations = calculateInvoiceTotals(lineItems, taxRate);

    // Determine status based on scheduledDate
    let status = invoiceData.status;
    if (invoiceData.scheduledDate !== undefined) {
      if (invoiceData.scheduledDate) {
        const scheduledDate = new Date(invoiceData.scheduledDate);
        const now = new Date();
        if (scheduledDate > now) {
          status = "scheduled";
        } else {
          status = "draft"; // Past scheduled date, revert to draft
        }
      } else {
        status = "draft"; // No scheduled date, revert to draft
      }
    }

    // Update invoice with recalculated values
    const data = insertInvoiceSchema.partial().parse({
      ...invoiceData,
      status,
      subtotal: calculations.subtotal,
      tax: calculations.tax,
      taxRate: taxRate.toString(),
      total: calculations.total,
    });

    const invoice = await storage.updateInvoice(id, userId, data);
    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    // Replace line items
    await storage.deleteLineItemsByInvoice(id);
    
    const preparedLineItems = prepareLineItems(lineItems);
    for (const item of preparedLineItems) {
      const validatedItem = insertLineItemSchema.parse({
        invoiceId: invoice.id,
        ...item,
      });
      await storage.createLineItem(validatedItem);
    }

    res.json(invoice);
  } else {
    // Update invoice without line items (e.g., status change)
    // Determine status based on scheduledDate
    let status = invoiceData.status;
    if (invoiceData.scheduledDate !== undefined) {
      if (invoiceData.scheduledDate) {
        const scheduledDate = new Date(invoiceData.scheduledDate);
        const now = new Date();
        if (scheduledDate > now) {
          status = "scheduled";
        } else {
          status = "draft"; // Past scheduled date, revert to draft
        }
      } else {
        status = "draft"; // No scheduled date, revert to draft
      }
    }

    const data = insertInvoiceSchema.partial().parse({
      ...invoiceData,
      status
    });
    const invoice = await storage.updateInvoice(id, userId, data);

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    res.json(invoice);
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice (cascades to line items)
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const deleted = await storage.deleteInvoice(id, userId);
  if (!deleted) {
    throw new AppError(404, 'Invoice not found');
  }

  res.status(204).send();
});

/**
 * GET /api/invoices/:invoiceId/line-items
 * Get line items for a specific invoice
 */
export const listLineItems = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { invoiceId } = req.params;

  // Verify invoice belongs to user
  const invoice = await storage.getInvoice(invoiceId, userId);
  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  const lineItems = await storage.getLineItemsByInvoice(invoiceId);
  res.json(lineItems);
});

/**
 * POST /api/invoices/process-scheduled
 * Manually trigger processing of scheduled invoices (admin/testing endpoint)
 */
export const processScheduled = asyncHandler(async (req: Request, res: Response) => {
  console.log('[Manual Trigger] Processing scheduled invoices...');

  const results = await processScheduledInvoices();

  res.json({
    success: true,
    message: `Processed ${results.processed} scheduled invoices`,
    results: {
      processed: results.processed,
      sent: results.sent,
      errors: results.errors,
      errorMessages: results.errorMessages
    }
  });
});

/**
 * POST /api/invoices/bulk
 * Create multiple invoices for different clients
 */
export const createBulk = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { invoices } = req.body;

  if (!Array.isArray(invoices) || invoices.length === 0) {
    throw new AppError(400, 'At least one invoice is required');
  }

  if (invoices.length > 100) {
    throw new AppError(400, 'Cannot create more than 100 invoices at once');
  }

  const createdInvoices = [];
  const errors = [];

  for (let i = 0; i < invoices.length; i++) {
    try {
      const { lineItems, taxRate, ...invoiceData } = invoices[i];

      // Validate each invoice
      const calculations = calculateInvoiceTotals(lineItems, taxRate || '0');
      
      if (invoiceData.total) {
        validateTotalMatch(calculations.total, invoiceData.total);
      }

      const invoiceNumber = await storage.getNextInvoiceNumber(userId);

      let status = "draft";
      if (invoiceData.scheduledDate) {
        const scheduledDate = new Date(invoiceData.scheduledDate);
        const now = new Date();
        if (scheduledDate > now) {
          status = "scheduled";
        }
      }

      const validatedInvoice = insertInvoiceSchema.parse({
        ...invoiceData,
        userId,
        invoiceNumber,
        status,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        taxRate: (taxRate || '0').toString(),
        total: calculations.total,
      });

      const preparedLineItems = prepareLineItems(lineItems);

      const invoice = await storage.createInvoiceWithLineItems(
        validatedInvoice,
        preparedLineItems
      );

      createdInvoices.push(invoice);
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.status(201).json({
    success: true,
    created: createdInvoices.length,
    failed: errors.length,
    invoices: createdInvoices,
    errors: errors.length > 0 ? errors : undefined,
  });
});

