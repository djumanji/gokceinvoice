import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { storage } from './storage';
import { hashPassword, comparePassword } from './auth';
import { validateCsrf } from './index';
import { insertUserSchema, insertProspectSchema } from '@shared/schema';
import { z } from 'zod';
import { sendVerificationEmail, sendPasswordResetEmail } from './services/email-service';
import { generateToken } from './services/jwt-service';
import { extractUserId } from './middleware/auth.middleware';

/**
 * Dummy bcrypt hash used for timing attack prevention.
 * This is intentionally NOT a real password hash - it's used when a user doesn't exist
 * to ensure constant-time comparison and prevent user enumeration attacks.
 * 
 * Semgrep will flag this as a hard-coded secret, but it's intentional for security.
 */
// nosemgrep: generic.secrets.security.detected-bcrypt-hash.detected-bcrypt-hash
const DUMMY_PASSWORD_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // Higher limit in development
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development for localhost
    if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
      return true;
    }
    return false;
  }
});

export function registerAuthRoutes(app: Express) {
  // Register endpoint
  app.post('/api/auth/register', authLimiter, validateCsrf, async (req, res) => {
    try {
      const { email, password, username, isProspect } = req.body;

      console.log('Registration attempt:', { email, username: username || 'not provided', isProspect });

      // Validate input based on whether this is a prospect or full registration
      let validation;
      if (isProspect) {
        // For prospects, only email is required
        validation = insertProspectSchema.safeParse({ email, isProspect: true });
      } else {
        // For full registration, email and password are required
        if (!password) {
          return res.status(400).json({ error: 'Password is required for registration' });
        }
        validation = insertUserSchema.safeParse({ email, password, username });
      }

      if (!validation.success) {
        console.log('Validation failed:', validation.error.errors);
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({ error: 'User already exists' });
      }

      let hashedPassword: string | undefined = undefined;
      let verificationToken: string | null = null;
      let verificationExpires: Date | null = null;
      let emailVerified = false;

      if (isProspect) {
        // For prospects, no password, no verification needed initially
        console.log('Creating prospect user with email only');
      } else {
        // Hash password for full registration
        hashedPassword = await hashPassword(password);
        console.log('Password hashed successfully');

        // Generate verification token for full registration
        verificationToken = randomBytes(32).toString('hex');
        verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      }

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        provider: 'local',
        isEmailVerified: emailVerified,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        isProspect: isProspect || false,
      });
      
      console.log('User created:', { id: user.id, email: user.email, isProspect });

      // Send verification email only for full registrations (not prospects)
      if (!isProspect && verificationToken) {
        try {
          await sendVerificationEmail({
            email,
            verificationToken,
            username
          });
          console.log('Verification email sent');
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Don't fail registration if email fails
        }
      }

      let responseMessage = 'Registration successful! Please check your email to verify your account.';
      let userResponse = {
        id: user.id,
        email: user.email,
        username: user.username
      };

      if (isProspect) {
        // For prospects, don't create session or redirect
        responseMessage = 'Thank you for your interest! We\'ve saved your email and will be in touch soon.';
        console.log('Prospect created, no session created');
      } else {
        // Regenerate session to prevent session fixation attacks for full registrations
        await new Promise<void>((resolve, reject) => {
          req.session.regenerate((err) => {
            if (err) return reject(err);
            // Store user ID in new session
            req.session.userId = user.id;
            req.session.save((err2) => {
              if (err2) reject(err2);
              else resolve();
            });
          });
        });

        console.log('Session created with userId:', user.id);
      }

      // Generate JWT token for mobile app compatibility
      const token = !isProspect ? generateToken(user) : undefined;

      res.status(201).json({
        user: userResponse,
        message: responseMessage,
        isProspect: isProspect || false,
        ...(token && { token }),
      });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // Check for database schema errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isDatabaseError = errorMessage.includes('does not exist') || 
                              errorMessage.includes('relation') ||
                              errorMessage.includes('table');
      
      if (isDatabaseError) {
        return res.status(500).json({
          error: 'Database tables not initialized. Please run database migrations.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          hint: 'Run: npm run db:setup or bash migrations/run-all.sh'
        });
      }
      
      res.status(500).json({
        error: 'An error occurred during registration. Please try again.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });
  
  // Login endpoint
  app.post('/api/auth/login', authLimiter, validateCsrf, async (req, res) => {
    try {
      console.log('[Login] Login attempt received');
      const { email, password } = req.body;
      console.log('[Login] Email:', email);

      if (!email || !password) {
        console.log('[Login] Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      console.log('[Login] Looking up user by email');
      const user = await storage.getUserByEmail(email);

      // Always perform bcrypt comparison to prevent timing attacks
      // Use a dummy hash if user doesn't exist OR if user doesn't have a password (OAuth)
      // This is intentional for security - generates a constant-time comparison
      // even when user doesn't exist to prevent user enumeration attacks
      const passwordHash = (user?.password) || DUMMY_PASSWORD_HASH;
      console.log('[Login] Comparing password');
      const isValid = await comparePassword(password, passwordHash);

      // Check both conditions after timing-constant operation
      // For OAuth users (no password), the dummy hash comparison will fail
      if (!user || !isValid) {
        console.log('[Login] Authentication failed');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Additional check: OAuth users must use OAuth login, not password login
      if (!user.password) {
        console.log('[Login] OAuth user attempted password login');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      console.log('[Login] Password valid, regenerating session');
      // Regenerate session to prevent session fixation attacks
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) return reject(err);
          // Store user ID in new session
          req.session.userId = user.id;
          req.session.save((err2) => {
            if (err2) reject(err2);
            else resolve();
          });
        });
      });

      console.log('[Login] Login successful for user:', user.id);
      const token = generateToken(user);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'An error occurred during login. Please try again.' });
    }
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', validateCsrf, async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // Get current user endpoint (supports both session and JWT)
  app.get('/api/auth/me', async (req, res) => {
    try {
      console.log('[Auth Me] Request received');
      
      // Check for JWT token first (mobile app)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const userId = extractUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Not authenticated' });
        }
        const user = await storage.getUserById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        });
      }

      // Fall back to session-based auth (web app)
      console.log('[Auth Me] Session exists:', !!req.session);
      
      // Check if session exists and has userId
      if (!req.session || !req.session.userId) {
        console.log('[Auth Me] No session or user ID, returning 401');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      console.log('[Auth Me] User ID from session:', userId);
      
      const user = await storage.getUserById(userId);
      if (!user) {
        console.log('[Auth Me] User not found in database');
        return res.status(401).json({ error: 'User not found' });
      }
      console.log('[Auth Me] User found, returning user data');
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        username: user.username,
        name: user.name,
        companyName: user.companyName,
        address: user.address,
        phone: user.phone,
        taxOfficeId: user.taxOfficeId
      });
    } catch (error) {
      console.error('Get user error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(401).json({ error: 'Failed to get user' });
    }
  });
  
  // Email verification endpoint
  app.get('/api/auth/verify-email', authLimiter, async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Invalid verification token' });
      }
      
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }
      
      if (user.emailVerificationExpires && new Date() > new Date(user.emailVerificationExpires)) {
        return res.status(400).json({ error: 'Verification token has expired' });
      }

      // Check if already verified to prevent token reuse
      if (user.isEmailVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      // Verify email (this clears the token)
      await storage.verifyUserEmail(user.id);

      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  });
  
  // Forgot password endpoint
  app.post('/api/auth/forgot-password', authLimiter, validateCsrf, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      // Don't reveal if user exists (security best practice)
      if (user) {
        const resetToken = randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        await storage.updateUser(user.id, {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        });
        
        try {
          await sendPasswordResetEmail({
            email,
            resetToken,
            username: user.username ?? undefined
          });
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
          // Don't fail the request if email fails
        }
      }
      
      // Always return success (security best practice)
      res.status(200).json({ 
        message: 'If an account with that email exists, we\'ve sent password reset instructions.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  });
  
  // Reset password endpoint
  app.post('/api/auth/reset-password', authLimiter, validateCsrf, async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      // Validate password strength
      const passwordSchema = insertUserSchema.pick({ password: true });
      const validation = passwordSchema.safeParse({ password });
      if (!validation.success) {
        return res.status(400).json({
          error: 'Password does not meet requirements',
          details: validation.error.errors.map(e => e.message)
        });
      }

      const user = await storage.getUserByPasswordResetToken(token);

      if (!user || !user.passwordResetExpires || new Date() > new Date(user.passwordResetExpires)) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Invalidate the token immediately to prevent reuse
      await storage.updateUser(user.id, {
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      // Then hash and update password
      const hashedPassword = await hashPassword(password);

      await storage.updateUser(user.id, {
        password: hashedPassword,
      });
      
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });
}

