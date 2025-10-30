import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt-service';

/**
 * Extended Request type with userId from session or JWT token
 */
export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Middleware to check if user is authenticated and attach userId to request
 * Supports both session-based (web) and JWT token-based (mobile) authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check for JWT token in Authorization header (mobile app)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      (req as AuthenticatedRequest).userId = payload.userId;
      return next();
    }
  }

  // Fall back to session-based auth (web app)
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Attach userId to request for use in controllers
  (req as AuthenticatedRequest).userId = userId;
  next();
}

/**
 * Extract userId from session or JWT token without requiring authentication
 * Useful for optional auth scenarios
 */
export function extractUserId(req: Request | any): string | null {
  // Check for JWT token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      return payload.userId;
    }
  }

  // Fall back to session
  return req.session.userId || null;
}

/**
 * Get userId from session or JWT token, throwing error if not found
 * Use this in places where auth is already enforced by middleware
 */
export function getUserId(req: Request): string {
  const userId = (req as AuthenticatedRequest).userId || extractUserId(req);
  if (!userId) {
    throw new Error('User ID not found in authenticated request');
  }
  return userId;
}


