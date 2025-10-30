import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { getUserId } from '../middleware/auth.middleware';
import { uploadToS3, uploadCompanyLogo } from '../services/s3-service';
import path from 'path';
import fs from 'fs/promises';

/**
 * Upload Controller
 * Handles file uploads to S3 and serving local files
 */

/**
 * POST /api/upload
 * Upload a file (receipt, etc.) to S3
 */
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!req.file) {
    throw new AppError(400, 'No file uploaded');
  }

  const { url, key } = await uploadToS3(
    req.file.buffer,
    req.file.originalname,
    userId,
    req.file.mimetype
  );

  res.json({ url, key });
});

/**
 * POST /api/upload/company-logo
 * Upload a company logo to S3
 */
export const uploadLogo = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!req.file) {
    throw new AppError(400, 'No logo file uploaded');
  }

  // Validate file type - only allow common image formats
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new AppError(400, 'Only JPEG, PNG, GIF, and WebP images are allowed');
  }

  // Validate file size - max 5MB for logos
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    throw new AppError(400, 'Logo file size must be less than 5MB');
  }

  const { url, key } = await uploadCompanyLogo(
    req.file.buffer,
    req.file.originalname,
    userId,
    req.file.mimetype
  );

  res.json({ url, key });
});

/**
 * GET /api/uploads/:filename
 * Serve locally uploaded files (dev mode)
 */
export const serveFile = asyncHandler(async (req: Request, res: Response) => {
  const filename = req.params.filename;
  const uploadsDir = path.join(process.cwd(), 'attached_assets');
  const filePath = path.join(uploadsDir, filename);

  // Security: prevent path traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(path.normalize(uploadsDir))) {
    throw new AppError(403, 'Forbidden');
  }

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new AppError(404, 'File not found');
  }

  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  const contentType = contentTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  const fileBuffer = await fs.readFile(filePath);
  res.send(fileBuffer);
});

