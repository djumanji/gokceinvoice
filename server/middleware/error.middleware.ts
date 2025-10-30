import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { z } from 'zod';

/**
 * Custom application error class for better error handling
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates try-catch boilerplate in every controller method
 * 
 * @example
 * router.get('/clients', asyncHandler(async (req, res) => {
 *   const clients = await storage.getClients(req.userId);
 *   res.json(clients);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 * Should be registered last in the middleware chain
 * Provides consistent error responses across the application
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request | any,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    });
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle unknown errors
  const statusCode = (err as any).statusCode || (err as any).status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
}

