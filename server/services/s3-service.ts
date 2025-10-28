import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

export interface FileUploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  userId: string,
  contentType: string
): Promise<FileUploadResult> {
  if (!BUCKET_NAME) {
    throw new Error('S3 bucket name is not configured');
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
    throw new Error('Failed to upload file to S3');
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
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error('S3 bucket name is not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
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

