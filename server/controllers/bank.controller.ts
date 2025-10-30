import type { Request, Response } from 'express';
import { BaseCrudController } from './base-crud.controller';
import { storage } from '../storage';
import { bankAccountSchema, type BankAccount } from '@shared/schema';
import { asyncHandler } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';

/**
 * Bank Account Controller
 * Handles CRUD operations for bank accounts with default account logic
 * Extends base controller and adds custom setDefault method
 */
class BankController extends BaseCrudController<BankAccount> {
  constructor() {
    super('Bank account', {
      getAll: (userId) => storage.getBankAccounts(userId),
      getOne: (id, userId) => storage.getBankAccount(id, userId),
      create: (data) => {
        // Extract userId from data (it's injected by base controller)
        const { userId, ...bankData } = data as any;
        
        // Clean optional fields
        const cleaned: any = { ...bankData };
        const optionalFields = ['accountNumber', 'iban', 'swiftCode', 'bankAddress', 'bankBranch'];
        for (const field of optionalFields) {
          if (cleaned[field] === null || cleaned[field] === '') {
            delete cleaned[field];
          }
        }
        
        return storage.createBankAccount(userId, cleaned);
      },
      update: (id, userId, data) => storage.updateBankAccount(id, userId, data),
      delete: (id, userId) => storage.deleteBankAccount(id, userId),
    }, bankAccountSchema);
  }

  /**
   * POST /api/bank-accounts/:id/set-default
   * Set a bank account as the default for invoicing
   */
  setDefault = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { id } = req.params;

    await storage.setDefaultBankAccount(id, userId);
    res.status(200).json({ success: true });
  });
}

// Export controller methods
const controller = new BankController();
export const { list, getOne, create, update, remove, setDefault } = controller;

