import type { Request, Response } from 'express';
import { storage } from '../storage';
import { updateUserProfileSchema } from '@shared/schema';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';

/**
 * User Controller
 * Handles user profile operations
 */

/**
 * PATCH /api/users/profile
 * Update user profile information
 * Body is validated and sanitized by middleware before reaching here
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  // Body has already been sanitized by middleware
  // Note: companyLogo is a URL and is validated by Zod schema, no additional sanitization needed
  const data = updateUserProfileSchema.parse(req.body);
  const user = await storage.updateUser(userId, data);
  
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json(user);
});

