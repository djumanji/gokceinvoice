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
 * Sanitize HTML content for email templates (allows safe HTML tags)
 * @param input - The HTML string to sanitize
 * @returns Sanitized HTML safe for email templates
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  if (typeof input !== 'string') return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['ul', 'li', 'strong', 'em', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['style'],
    USE_PROFILES: { html: true },
  });
}

/**
 * Escape HTML entities for safe text insertion
 * @param input - The string to escape
 * @returns Escaped string safe for HTML insertion
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return '';
  if (typeof input !== 'string') return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
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
