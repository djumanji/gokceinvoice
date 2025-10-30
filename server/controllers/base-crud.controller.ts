import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';
import type { ZodSchema } from 'zod';

/**
 * Interface for CRUD storage operations
 * Controllers implement this to connect to the storage layer
 */
export interface CrudStorage<T> {
  getAll(userId: string): Promise<T[]>;
  getOne(id: string, userId: string): Promise<T | undefined>;
  create(data: any): Promise<T>;
  update(id: string, userId: string, data: any): Promise<T | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
}

/**
 * Base CRUD Controller
 * Implements standard CRUD operations following NestJS patterns
 * Eliminates code duplication across resource controllers
 * 
 * Based on industry best practices from:
 * - NestJS framework (trust score 9.5)
 * - @nestjsx/crud patterns
 * - nodejs-backend-architecture-typescript (trust score 9.8)
 * 
 * @example
 * ```typescript
 * class ClientController extends BaseCrudController<Client> {
 *   constructor() {
 *     super('Client', {
 *       getAll: (userId) => storage.getClients(userId),
 *       getOne: (id, userId) => storage.getClient(id, userId),
 *       create: (data) => storage.createClient(data),
 *       update: (id, userId, data) => storage.updateClient(id, userId, data),
 *       delete: (id, userId) => storage.deleteClient(id, userId),
 *     }, insertClientSchema);
 *   }
 * }
 * ```
 */
export abstract class BaseCrudController<T> {
  constructor(
    protected resourceName: string,
    protected storage: CrudStorage<T>,
    protected schema: ZodSchema
  ) {}

  /**
   * GET /api/resources
   * List all resources for the authenticated user
   */
  list = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const items = await this.storage.getAll(userId);
    res.json(items);
  });

  /**
   * GET /api/resources/:id
   * Get a specific resource by ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const item = await this.storage.getOne(id, userId);
    if (!item) {
      throw new AppError(404, `${this.resourceName} not found`);
    }
    
    res.json(item);
  });

  /**
   * POST /api/resources
   * Create a new resource
   * Body is validated and sanitized by middleware before reaching here
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const data = this.schema.parse({ ...req.body, userId });
    const item = await this.storage.create(data);
    res.status(201).json(item);
  });

  /**
   * PATCH /api/resources/:id
   * Update an existing resource
   * Body is validated and sanitized by middleware before reaching here
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const data = this.schema.partial().parse(req.body);
    const item = await this.storage.update(id, userId, data);
    
    if (!item) {
      throw new AppError(404, `${this.resourceName} not found`);
    }
    
    res.json(item);
  });

  /**
   * DELETE /api/resources/:id
   * Delete a resource
   */
  remove = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const deleted = await this.storage.delete(id, userId);
    if (!deleted) {
      throw new AppError(404, `${this.resourceName} not found`);
    }
    
    res.status(204).send();
  });
}

