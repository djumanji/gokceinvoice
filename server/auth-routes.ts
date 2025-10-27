import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { storage } from './storage';
import { hashPassword, comparePassword } from './auth';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

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
  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      console.log('Registration attempt:', { email, username: username || 'not provided' });
      
      // Validate input
      if (!email || !password) {
        console.log('Validation failed: missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
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
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        provider: 'local',
        isEmailVerified: false,
      });
      
      console.log('User created:', { id: user.id, email: user.email });
      
      // Store user ID in session
      req.session.userId = user.id;
      console.log('Session created with userId:', user.id);
      
      res.status(201).json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username 
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: 'Failed to register user', details: process.env.NODE_ENV === 'development' ? String(error) : undefined });
    }
  });
  
  // Login endpoint
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Compare password
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', async (req, res) => {
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
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        username: user.username 
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });
}

