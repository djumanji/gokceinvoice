import type { Request, Response } from 'express';
import { storage } from '../storage';
import { insertRecurringInvoiceSchema, insertRecurringInvoiceItemSchema } from '@shared/schema';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';

/**
 * Recurring Invoice Controller
 * Handles CRUD operations for recurring invoices
 */

/**
 * GET /api/recurring-invoices
 * Get all recurring invoices for the authenticated user
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const recurringInvoices = await storage.getRecurringInvoices(userId);
  
  // Fetch items for each recurring invoice
  const recurringInvoicesWithItems = await Promise.all(
    recurringInvoices.map(async (recurring) => {
      const items = await storage.getRecurringInvoiceItems(recurring.id);
      return {
        ...recurring,
        items,
      };
    })
  );
  
  res.json(recurringInvoicesWithItems);
});

/**
 * GET /api/recurring-invoices/:id
 * Get a specific recurring invoice by ID
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const recurringInvoice = await storage.getRecurringInvoice(id, userId);
  if (!recurringInvoice) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  const items = await storage.getRecurringInvoiceItems(recurringInvoice.id);

  res.json({
    ...recurringInvoice,
    items,
  });
});

/**
 * POST /api/recurring-invoices
 * Create a new recurring invoice template
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { items, ...recurringInvoiceData } = req.body;

  // Validate recurring invoice data
  const validatedRecurringInvoice = insertRecurringInvoiceSchema.parse({
    ...recurringInvoiceData,
    userId,
  });

  // Validate items
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'At least one line item is required');
  }

  const validatedItems = items.map((item: any, index: number) =>
    insertRecurringInvoiceItemSchema.parse({
      ...item,
      position: index,
    })
  );

  // Create recurring invoice with items
  const recurringInvoice = await storage.createRecurringInvoice(
    validatedRecurringInvoice,
    validatedItems
  );

  const createdItems = await storage.getRecurringInvoiceItems(recurringInvoice.id);

  res.status(201).json({
    ...recurringInvoice,
    items: createdItems,
  });
});

/**
 * PATCH /api/recurring-invoices/:id
 * Update an existing recurring invoice
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { items, ...recurringInvoiceData } = req.body;

  // Check if recurring invoice exists and belongs to user
  const existingRecurringInvoice = await storage.getRecurringInvoice(id, userId);
  if (!existingRecurringInvoice) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  // Update recurring invoice (without items)
  const data = insertRecurringInvoiceSchema.partial().parse(recurringInvoiceData);
  const updatedRecurringInvoice = await storage.updateRecurringInvoice(id, userId, data);
  
  if (!updatedRecurringInvoice) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  // If items are provided, update them
  if (items && Array.isArray(items)) {
    // Delete existing items
    const existingItems = await storage.getRecurringInvoiceItems(id);
    // Note: We'll need to implement deleteAll and recreate, or update individually
    // For now, we'll just update the recurring invoice metadata
    // Full item replacement would require additional storage methods
  }

  const updatedItems = await storage.getRecurringInvoiceItems(id);

  res.json({
    ...updatedRecurringInvoice,
    items: updatedItems,
  });
});

/**
 * DELETE /api/recurring-invoices/:id
 * Delete a recurring invoice
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const deleted = await storage.deleteRecurringInvoice(id, userId);
  if (!deleted) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  res.status(204).send();
});

/**
 * POST /api/recurring-invoices/:id/pause
 * Pause a recurring invoice
 */
export const pause = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const recurringInvoice = await storage.getRecurringInvoice(id, userId);
  if (!recurringInvoice) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  const updated = await storage.updateRecurringInvoice(id, userId, {
    isActive: false,
  });

  if (!updated) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  res.json(updated);
});

/**
 * POST /api/recurring-invoices/:id/resume
 * Resume a paused recurring invoice
 */
export const resume = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const recurringInvoice = await storage.getRecurringInvoice(id, userId);
  if (!recurringInvoice) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  const updated = await storage.updateRecurringInvoice(id, userId, {
    isActive: true,
  });

  if (!updated) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  res.json(updated);
});

/**
 * POST /api/recurring-invoices/:id/generate
 * Manually generate an invoice from a recurring template
 */
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const recurringInvoice = await storage.getRecurringInvoice(id, userId);
  if (!recurringInvoice) {
    throw new AppError(404, 'Recurring invoice not found');
  }

  // Import the recurring invoice generation service
  const { generateInvoiceFromRecurring } = await import('../services/recurring-invoice.service');
  
  const invoice = await generateInvoiceFromRecurring(recurringInvoice.id, userId);

  res.status(201).json(invoice);
});
