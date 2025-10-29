import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const EXPENSE_UPLOADS_PREFIX = 'expenses/';
const COMPANY_LOGOS_PREFIX = 'company-logos/';

// Dev mode: local file storage directory
const DEV_UPLOADS_DIR = path.join(process.cwd(), 'attached_assets');

export interface FileUploadResult {
  url: string;
  key: string;
}

/**
 * Upload file to local storage (dev mode fallback)
 */
async function uploadToLocal(
  file: Buffer,
  fileName: string,
  userId: string,
  contentType: string,
  prefix: string
): Promise<FileUploadResult> {
  // Ensure uploads directory exists
  await fs.mkdir(DEV_UPLOADS_DIR, { recursive: true });

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileNameWithTimestamp = `${timestamp}-${sanitizedFileName}`;
  const filePath = path.join(DEV_UPLOADS_DIR, fileNameWithTimestamp);

  // Write file to disk
  await fs.writeFile(filePath, file);

  // Generate URL that will be served by the server
  const url = `/api/uploads/${fileNameWithTimestamp}`;
  const key = `${prefix}${userId}/${fileNameWithTimestamp}`;

  return { url, key };
}

/**
 * Upload a file to S3 (or local storage if S3 is not configured)
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  userId: string,
  contentType: string
): Promise<FileUploadResult> {
  // Fallback to local storage if S3 is not configured
  if (!BUCKET_NAME) {
    console.log('Using local file storage (S3 not configured)');
    return await uploadToLocal(file, fileName, userId, contentType, EXPENSE_UPLOADS_PREFIX);
  }

  // Generate unique key for the file
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${EXPENSE_UPLOADS_PREFIX}${userId}/${timestamp}-${sanitizedFileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return the public URL or generate a presigned URL
    const url = process.env.AWS_S3_PUBLIC_URL 
      ? `${process.env.AWS_S3_PUBLIC_URL}/${key}`
      : await getPresignedUrl(key);

    return { url, key };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    // Fallback to local storage if S3 fails
    console.log('Falling back to local file storage due to S3 error');
    return await uploadToLocal(file, fileName, userId, contentType, EXPENSE_UPLOADS_PREFIX);
  }
}

/**
 * Upload a company logo to S3 (or local storage if S3 is not configured)
 */
export async function uploadCompanyLogo(
  file: Buffer,
  fileName: string,
  userId: string,
  contentType: string
): Promise<FileUploadResult> {
  // Fallback to local storage if S3 is not configured
  if (!BUCKET_NAME) {
    console.log('Using local file storage for company logo (S3 not configured)');
    return await uploadToLocal(file, fileName, userId, contentType, COMPANY_LOGOS_PREFIX);
  }

  // Generate unique key for the company logo
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${COMPANY_LOGOS_PREFIX}${userId}/${timestamp}-${sanitizedFileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return the public URL or generate a presigned URL
    const url = process.env.AWS_S3_PUBLIC_URL 
      ? `${process.env.AWS_S3_PUBLIC_URL}/${key}`
      : await getPresignedUrl(key);

    return { url, key };
  } catch (error) {
    console.error('Error uploading company logo to S3:', error);
    // Fallback to local storage if S3 fails
    console.log('Falling back to local file storage for company logo due to S3 error');
    return await uploadToLocal(file, fileName, userId, contentType, COMPANY_LOGOS_PREFIX);
  }
}

/**
 * Generate a presigned URL for private objects
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3 or local storage
 */
export async function deleteFromS3(key: string): Promise<void> {
  // If S3 is not configured, assume this is a local file
  if (!BUCKET_NAME) {
    // Extract filename from key (format: prefix/userId/timestamp-filename)
    const parts = key.split('/');
    const fileName = parts[parts.length - 1];
    
    if (fileName) {
      const filePath = path.join(DEV_UPLOADS_DIR, fileName);
      try {
        await fs.unlink(filePath);
        return;
      } catch (error) {
        // File might not exist, that's okay
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error('Error deleting local file:', error);
        }
        return;
      }
    }
    return;
  }

  // S3 deletion
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    // If S3 deletion fails, try local as fallback (in case file was uploaded locally but key was stored)
    const parts = key.split('/');
    const fileName = parts[parts.length - 1];
    if (fileName) {
      const filePath = path.join(DEV_UPLOADS_DIR, fileName);
      try {
        await fs.unlink(filePath);
        console.log('Deleted from local storage as fallback');
      } catch {
        // Ignore errors - file might not exist locally
      }
    }
    // Re-throw the S3 error if we're in production or if local deletion also failed
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Extract S3 key from URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  // Extract key from public URL format: https://bucket.s3.region.amazonaws.com/path/to/file
  // or https://cdn.domain.com/path/to/file
  const match = url.match(/expenses\/[^?]+/);
  return match ? match[0] : null;
}

