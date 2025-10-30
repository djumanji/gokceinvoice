import type { Request, Response, NextFunction } from 'express';

/**
 * Extended Request type with userId from session
 */
export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Middleware to check if user is authenticated and attach userId to request
 * Replaces 30+ manual auth checks throughout the codebase
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Attach userId to request for use in controllers
  (req as AuthenticatedRequest).userId = userId;
  next();
}

/**
 * Extract userId from session without requiring authentication
 * Useful for optional auth scenarios
 */
export function extractUserId(req: Request): string | null {
  return req.session.userId || null;
}

/**
 * Get userId from session, throwing error if not found
 * Use this in places where auth is already enforced by middleware
 */
export function getUserId(req: Request): string {
  const userId = (req as AuthenticatedRequest).userId || req.session.userId;
  if (!userId) {
    throw new Error('User ID not found in authenticated request');
  }
  return userId;
}

