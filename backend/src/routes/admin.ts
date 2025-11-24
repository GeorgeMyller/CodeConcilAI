import { Router, Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { db } from '../services/databaseService.js';

const router = Router();

// Middleware to check admin status
const isAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.isAdmin) {
      return _res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// GET dashboard stats
router.get('/stats', isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await AdminService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET audit logs with filters
router.get('/audit-logs', isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, action, severity, limit = '50', offset = '0' } = req.query;

    const result = await AdminService.getAuditLogs({
      userId: userId as string,
      action: action as string,
      severity: severity as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET user details
router.get('/users/:userId', isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AdminService.getUserDetails(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST suspend user
router.post(
  '/users/:userId/suspend',
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason = 'No reason provided' } = req.body;
      await AdminService.suspendUser(req.params.userId, reason);
      res.json({ message: 'User suspended' });
    } catch (error) {
      next(error);
    }
  }
);

// POST reactivate user
router.post(
  '/users/:userId/reactivate',
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AdminService.reactivateUser(req.params.userId);
      res.json({ message: 'User reactivated' });
    } catch (error) {
      next(error);
    }
  }
);

// GET usage analytics
router.get('/analytics', isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await AdminService.getUsageAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

export default router;
