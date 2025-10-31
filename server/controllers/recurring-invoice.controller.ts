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
  
  const recurringInvoiceIds = recurringInvoices.map(ri => ri.id);
  const allItems = await storage.getRecurringInvoiceItemsByIds(recurringInvoiceIds);
  
  const itemsByRecurringInvoiceId = allItems.reduce((acc, item) => {
    if (!acc[item.recurringInvoiceId]) {
      acc[item.recurringInvoiceId] = [];
    }
    acc[item.recurringInvoiceId].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);
  
  // Attach items to their respective recurring invoices
  const recurringInvoicesWithItems = recurringInvoices.map(recurring => ({
    ...recurring,
    items: itemsByRecurringInvoiceId[recurring.id] || [],
  }));
  
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
 * POST /api/recurring-invoices/bulk
 * Create multiple recurring invoices for different clients
 */
export const createBulk = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { recurringInvoices } = req.body;

  if (!Array.isArray(recurringInvoices) || recurringInvoices.length === 0) {
    throw new AppError(400, 'At least one recurring invoice is required');
  }

  if (recurringInvoices.length > 100) {
    throw new AppError(400, 'Cannot create more than 100 recurring invoices at once');
  }

  const createdRecurringInvoices = [];
  const errors = [];

  for (let i = 0; i < recurringInvoices.length; i++) {
    try {
      const { items, ...recurringInvoiceData } = recurringInvoices[i];

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

      createdRecurringInvoices.push({
        ...recurringInvoice,
        items: createdItems,
      });
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.status(201).json({
    success: true,
    created: createdRecurringInvoices.length,
    failed: errors.length,
    recurringInvoices: createdRecurringInvoices,
    errors: errors.length > 0 ? errors : undefined,
  });
});

