import type { Request, Response } from 'express';
import { BaseCrudController } from './base-crud.controller';
import { storage } from '../storage';
import { insertExpenseSchema, type Expense } from '@shared/schema';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';
import { deleteFromS3, extractS3KeyFromUrl } from '../services/s3-service';
import {
  calculateExpenseAnalytics,
  filterExpensesByDateRange,
  type ExpenseAnalytics,
} from '../services/expense-analytics.service';

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

  /**
   * GET /api/expenses/analytics
   * Get expense analytics and insights
   * Query params: startDate, endDate, period (month|quarter|year), taxRate
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    
    // Get all expenses for the user
    let expenses = await storage.getExpenses(userId);

    // Filter by date range if provided
    const { startDate, endDate, period = 'month', taxRate = '0' } = req.query;
    
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      expenses = filterExpensesByDateRange(expenses, start, end);
    }

    // Parse tax rate
    const taxRateNum = parseFloat(taxRate as string) || 0;
    if (taxRateNum < 0 || taxRateNum > 100) {
      throw new AppError(400, 'Tax rate must be between 0 and 100');
    }

    // Validate period
    const validPeriods = ['month', 'quarter', 'year'];
    if (!validPeriods.includes(period as string)) {
      throw new AppError(400, `Period must be one of: ${validPeriods.join(', ')}`);
    }

    // Calculate analytics
    const analytics: ExpenseAnalytics = calculateExpenseAnalytics(
      expenses,
      taxRateNum,
      period as 'month' | 'quarter' | 'year'
    );

    res.json(analytics);
  });
}

// Export controller methods
const controller = new ExpenseController();
export const { list, getOne, create, update, remove, getAnalytics } = controller;

