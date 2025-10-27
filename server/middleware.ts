import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  next();
}

/**
 * Middleware to set userId from session on request object
 */
export function setUserId(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  (req as any).userId = userId;
  next();
}

