import type { Express } from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import GitHubStrategy from 'passport-github2';
import { storage } from './storage';

// Passport session serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy - only register if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists by provider
      let user = await storage.getUserByProvider('google', String(profile.id));
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email: profile.emails?.[0]?.value || `${profile.id}@google.oauth`,
          username: profile.displayName,
          password: null,
          provider: 'google',
          providerId: String(profile.id),
          isEmailVerified: true,
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// GitHub OAuth Strategy - only register if credentials are available
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy.Strategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback'
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists by provider
      let user = await storage.getUserByProvider('github', String(profile.id));
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email: profile.emails?.[0]?.value || `${profile.username}@github.oauth`,
          username: profile.username || profile.displayName,
          password: null,
          provider: 'github',
          providerId: String(profile.id),
          isEmailVerified: true,
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

export function registerOAuthRoutes(app: Express) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      req.session.userId = (req.user as any).id;
      res.redirect('/');
    }
  );

  // GitHub OAuth
  app.get('/api/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get('/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
      req.session.userId = (req.user as any).id;
      res.redirect('/');
    }
  );
}

