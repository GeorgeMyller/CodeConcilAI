import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { DatabaseService } from '../services/databaseService.js';
import { StripeService } from '../services/stripeService.js';
import { EmailService } from '../services/emailService.js';
import { captureException } from '../services/sentryService.js';

const router = express.Router();

const COSTS = {
  startup: 50,
  enterprise: 150
};

/**
 * GET /api/billing/plans
 * Get available billing plans
 */
router.get('/plans', (req: Request, res: Response) => {
  res.json({
    plans: [
      {
        id: 'startup',
        name: 'Startup Audit',
        description: 'Essential validation for MVPs',
        credits: 50,
        agents: 3,
        languages: 1,
        price: 0 // Free trial included
      },
      {
        id: 'enterprise',
        name: 'Enterprise Deep Dive',
        description: 'Full compliance and security',
        credits: 150,
        agents: 6,
        languages: 3,
        price: 0 // Free trial included
      }
    ],
    trialCredits: 400
  });
});

/**
 * GET /api/billing/usage
 * Get user's current credits and usage
 */
router.get('/usage', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const user = await DatabaseService.getUserWithCredits(userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await DatabaseService.getTransactionHistory(userId!, 100);
    const spent = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      credits: user.credits,
      spent,
      isUnlimited: user.isUnlimited,
      transactions: transactions.slice(0, 10)
    });
  } catch (err) {
    captureException(err as Error, { action: 'get_usage', userId });
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

/**
 * POST /api/billing/deduct
 * Deduct credits for an analysis run
 */
router.post('/deduct', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { tier } = req.body;
  const userId = req.user?.id;

  if (!userId || !tier) {
    return res.status(400).json({ error: 'Missing userId or tier' });
  }

  const cost = COSTS[tier as keyof typeof COSTS];
  if (!cost) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  try {
    const user = await DatabaseService.getUserWithCredits(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isUnlimited) {
      // BYOK mode - no credits deducted
      return res.json({ success: true, credits: 0, isUnlimited: true });
    }

    if (user.credits < cost) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: cost,
        available: user.credits
      });
    }

    // Deduct credits
    await DatabaseService.updateUser(userId, {
      credits: user.credits - cost
    });

    // Record transaction
    const transaction = await DatabaseService.createTransaction({
      userId,
      tier,
      amount: cost,
      status: 'completed',
      description: `${tier} audit`
    });

    // Log event
    await DatabaseService.logAuditEvent('analysis_run', userId, { tier, cost });

    res.json({
      success: true,
      credits: user.credits - cost,
      transactionId: transaction.id
    });
  } catch (err) {
    captureException(err as Error, { action: 'process_transaction', userId });
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

/**
 * POST /api/billing/upgrade-to-unlimited
 * Upgrade user to BYOK (Bring Your Own Key) unlimited mode
 */
router.post('/upgrade-to-unlimited', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    await DatabaseService.updateUser(userId, {
      isUnlimited: true,
      credits: 0
    });

    await DatabaseService.logAuditEvent('upgrade_to_unlimited', userId, {});

    res.json({
      success: true,
      isUnlimited: true,
      message: 'You are now in BYOK (Bring Your Own Key) unlimited mode'
    });
  } catch (err) {
    captureException(err as Error, { action: 'upgrade_to_unlimited', userId });
    res.status(500).json({ error: 'Failed to upgrade account' });
  }
});

export default router;
