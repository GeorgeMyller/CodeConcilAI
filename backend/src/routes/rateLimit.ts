import { Router, Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../services/rateLimitService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { db } from '../services/databaseService.js';

const router = Router();

// GET user rate limits
router.get('/usage', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine tier based on subscription
    let tier: 'startup' | 'enterprise' | 'unlimited' = 'startup';
    if (user.isUnlimited) {
      tier = 'unlimited';
    } else if (user.credits > 500) {
      tier = 'enterprise';
    }

    const limits = await RateLimitService.getUserLimits(user.id, tier);
    res.json(limits);
  } catch (error) {
    next(error);
  }
});

export default router;
