import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { storage } from './storage';
import { hashPassword, comparePassword } from './auth';
import { validateCsrf } from './index';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { sendVerificationEmail, sendPasswordResetEmail } from './services/email-service';

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
      const { email, password, username } = req.body;

      console.log('Registration attempt:', { email, username: username || 'not provided' });

      // Validate input with Zod schema
      const validation = insertUserSchema.safeParse({ email, password, username });
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
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      console.log('Password hashed successfully');
      
      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        provider: 'local',
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });
      
      console.log('User created:', { id: user.id, email: user.email });
      
      // Send verification email
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

      console.log('Session created with userId:', user.id);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        message: 'Registration successful! Please check your email to verify your account.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
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
      // Use a dummy hash if user doesn't exist
      const passwordHash = user?.password || '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // invalid hash
      console.log('[Login] Comparing password');
      const isValid = await comparePassword(password, passwordHash);

      // Check both conditions after timing-constant operation
      if (!user || !user.password || !isValid) {
        console.log('[Login] Authentication failed');
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
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
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
  
  // Get current user endpoint
  app.get('/api/auth/me', async (req, res) => {
    try {
      console.log('[Auth Me] Request received');
      console.log('[Auth Me] Session:', req.session);
      const userId = req.session.userId;
      console.log('[Auth Me] User ID from session:', userId);
      if (!userId) {
        console.log('[Auth Me] No user ID in session, returning 401');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        console.log('[Auth Me] User not found in database');
        return res.status(404).json({ error: 'User not found' });
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
        taxOfficeId: user.taxOfficeId,
        preferredCurrency: user.preferredCurrency
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
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

