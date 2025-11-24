import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { RateLimitService } from '../services/rateLimitService.js';
import { db } from '../services/databaseService.js';

export const rateLimitMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine tier
    let tier: 'startup' | 'enterprise' | 'unlimited' = 'startup';
    if (user.isUnlimited) {
      tier = 'unlimited';
    } else if (user.credits > 500) {
      tier = 'enterprise';
    }

    // Check rate limit
    try {
      const result = await RateLimitService.checkAndTrackRequest(userId, tier);
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset.toISOString());
    } catch (err: any) {
      return res.status(429).json({
        error: err.message,
        retryAfter: 3600 // 1 hour
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const analysisRateLimitMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine tier
    let tier: 'startup' | 'enterprise' | 'unlimited' = 'startup';
    if (user.isUnlimited) {
      tier = 'unlimited';
    } else if (user.credits > 500) {
      tier = 'enterprise';
    }

    // Check analysis rate limit
    try {
      const result = await RateLimitService.checkAndTrackAnalysis(userId, tier);
      res.setHeader('X-Analysis-Limit', result.limit);
      res.setHeader('X-Analysis-Remaining', result.remaining);
      res.setHeader('X-Analysis-Reset', result.reset.toISOString());
    } catch (err: any) {
      return res.status(429).json({
        error: err.message,
        retryAfter: 86400 // 24 hours
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
