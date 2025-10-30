import type { Request, Response } from 'express';
import { BaseCrudController } from './base-crud.controller';
import { storage } from '../storage';
import { insertExpenseSchema, type Expense } from '@shared/schema';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';
import { deleteFromS3, extractS3KeyFromUrl } from '../services/s3-service';

/**
 * Expense Controller
 * Handles CRUD operations for expenses with S3 receipt management
 * Extends base controller and overrides remove to handle S3 cleanup
 */
class ExpenseController extends BaseCrudController<Expense> {
  constructor() {
    super('Expense', {
      getAll: (userId) => storage.getExpenses(userId),
      getOne: (id, userId) => storage.getExpense(id, userId),
      create: (data) => storage.createExpense(data),
      update: (id, userId, data) => storage.updateExpense(id, userId, data),
      delete: (id, userId) => storage.deleteExpense(id, userId),
    }, insertExpenseSchema);
  }

  /**
   * DELETE /api/expenses/:id
   * Delete an expense and its associated S3 receipt
   * Overrides base method to add S3 cleanup logic
   */
  remove = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { id } = req.params;

    // Get the expense first to check if it has a receipt
    const expense = await storage.getExpense(id, userId);
    
    const deleted = await storage.deleteExpense(id, userId);
    if (!deleted) {
      throw new AppError(404, 'Expense not found');
    }

    // Clean up the S3 file if it exists
    if (expense?.receipt) {
      try {
        const key = extractS3KeyFromUrl(expense.receipt);
        if (key) {
          await deleteFromS3(key);
        }
      } catch (error) {
        console.error('Failed to delete S3 file:', error);
        // Don't fail the expense deletion if S3 cleanup fails
      }
    }

    res.status(204).send();
  });
}

// Export controller methods
const controller = new ExpenseController();
export const { list, getOne, create, update, remove } = controller;

