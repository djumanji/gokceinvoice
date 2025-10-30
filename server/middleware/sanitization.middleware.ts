import type { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../sanitize';

/**
 * Middleware factory to automatically sanitize specified fields in request body
 * Eliminates manual sanitization calls in every controller
 * 
 * @param fields - Array of field names to sanitize
 * @returns Express middleware function
 * 
 * @example
 * router.post('/clients', 
 *   sanitizeBody(['name', 'company', 'address', 'notes']),
 *   clientController.create
 * );
 */
export function sanitizeBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, fields);
    }
    next();
  };
}

/**
 * Common field groups for sanitization
 */
export const SanitizationFields = {
  client: ['name', 'company', 'address', 'notes', 'taxId'],
  invoice: ['notes', 'orderNumber', 'projectNumber', 'forProject'],
  lineItem: ['description'],
  service: ['name', 'description', 'category'],
  expense: ['description', 'category', 'vendor', 'receipt', 'tags'],
  user: ['name', 'companyName', 'address', 'phone', 'taxOfficeId'],
  bankAccount: ['accountHolderName', 'bankName', 'accountNumber', 'iban', 'swiftCode', 'bankAddress', 'bankBranch'],
  project: ['name', 'description'],
} as const;

