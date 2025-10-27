import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The string to sanitize
 * @returns Sanitized string safe for storage/display
 */
export function sanitize(input: string | null | undefined): string | null {
  if (!input) return null;
  if (typeof input !== 'string') return null;

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitize an object's string properties
 * @param obj - Object with properties to sanitize
 * @param fields - Array of field names to sanitize
 * @returns Object with sanitized fields
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const sanitized = { ...obj };

  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitize(sanitized[field] as string) as any;
    }
  }

  return sanitized;
}
