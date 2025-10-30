/**
 * Centralized middleware exports
 * Makes it easy to import middleware throughout the application
 */

export * from './auth.middleware';
export * from './validation.middleware';
export * from './error.middleware';
export * from './sanitization.middleware';

// Re-export the original requireAuth from middleware.ts for backwards compatibility
// This can be removed once all references are updated to use the new middleware
export { requireAuth as legacyRequireAuth, setUserId } from '../middleware';

