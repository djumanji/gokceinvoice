import type { Request, Response } from 'express';
import { z } from 'zod';

/**
 * Gets the userId from the session
 */
export function getUserId(req: Request): string | null {
  return req.session.userId || null;
}

/**
 * Gets the userId from session and returns 401 if not authenticated
 */
export function requireUserId(req: Request, res: Response): string | null {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

/**
 * Wraps async route handlers with error handling
 */
export function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>
) {
  return async (req: Request, res: Response, next: any) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        next(error); // Pass to express error handler
      }
    }
  };
}

