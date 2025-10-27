import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { type InsertUser } from '@shared/schema';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random string for OAuth state parameter
 */
export function generateState(): string {
  return randomBytes(32).toString('hex');
}

