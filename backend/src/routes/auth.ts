import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { DatabaseService } from '../services/databaseService.js';
import { StripeService } from '../services/stripeService.js';
import { EmailService } from '../services/emailService.js';
import { captureException } from '../services/sentryService.js';

const router = express.Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * POST /api/auth/google
 * Exchange Google ID token for JWT
 */
router.post('/google', async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('No payload');

    const googleId = payload.sub!;
    const email = payload.email!;
    const name = payload.name || 'User';
    const picture = payload.picture || '';

    // Try to find existing user
    let user = await DatabaseService.findUserByGoogleId(googleId);

    // If new user, create account + Stripe customer
    if (!user) {
      user = await DatabaseService.createUser({
        googleId,
        email,
        name,
        picture,
        credits: 400, // Initial trial credits
        isUnlimited: false
      });

      // Create Stripe customer
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const stripeCustomer = await StripeService.createCustomer(email, name);
          await DatabaseService.createStripeCustomer(user.id, stripeCustomer.id);
        } catch (err) {
          captureException(err as Error, { action: 'create_stripe_customer', userId: user.id });
        }
      }

      // Send welcome email
      try {
        await EmailService.sendWelcomeEmail(email, name);
      } catch (err) {
        captureException(err as Error, { action: 'send_welcome_email', userId: user.id });
      }

      // Log signup
      await DatabaseService.logAuditEvent('user_signup', user.id, { email });
    }

    // Generate JWT
    // Type assertion needed due to TypeScript's strict overload resolution
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRATION || '7d' } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        credits: user.credits,
        isUnlimited: user.isUnlimited
      }
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    captureException(err, { action: 'google_auth' });
    return res.status(401).json({ error: 'Invalid Google token' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await DatabaseService.getUserWithCredits(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      credits: user.credits,
      isUnlimited: user.isUnlimited,
      createdAt: user.createdAt
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
