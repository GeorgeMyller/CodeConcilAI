import { Router, Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscriptionService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// GET all available plans
router.get('/plans', async (_req: Request, res: Response) => {
  res.json(SubscriptionService.getAllPlans());
});

// GET user's current subscription
router.get('/current', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subscription = await SubscriptionService.getSubscriptionDetails(req.user!.id);
    res.json(subscription || { plan: null, status: 'inactive' });
  } catch (error) {
    next(error);
  }
});

// POST create new subscription
router.post('/create', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId required' });
    }

    const subscription = await SubscriptionService.createSubscription(req.user!.id, planId);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

// POST cancel subscription
router.post('/cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { atPeriodEnd = true } = req.body;
    await SubscriptionService.cancelSubscription(req.user!.id, atPeriodEnd);
    res.json({ message: 'Subscription canceled' });
  } catch (error) {
    next(error);
  }
});

// POST change plan
router.post('/change-plan', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { newPlanId } = req.body;
    if (!newPlanId) {
      return res.status(400).json({ error: 'newPlanId required' });
    }

    await SubscriptionService.updateSubscriptionPlan(req.user!.id, newPlanId);
    res.json({ message: 'Plan changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
