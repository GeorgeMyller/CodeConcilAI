import { db } from './databaseService.js';

const LIMITS = {
  startup: {
    requestsPerDay: 1000,
    requestsPerMonth: 20000,
    analysisRunsPerDay: 20,
    analysisRunsPerMonth: 200
  },
  enterprise: {
    requestsPerDay: 10000,
    requestsPerMonth: 200000,
    analysisRunsPerDay: 500,
    analysisRunsPerMonth: 5000
  },
  unlimited: {
    requestsPerDay: Infinity,
    requestsPerMonth: Infinity,
    analysisRunsPerDay: Infinity,
    analysisRunsPerMonth: Infinity
  }
};

export const RateLimitService = {
  async checkAndTrackRequest(userId: string, userTier: 'startup' | 'enterprise' | 'unlimited') {
    const limits = LIMITS[userTier];
    let tracker = await db.rateLimitTracker.findUnique({ where: { userId } });

    if (!tracker) {
      tracker = await db.rateLimitTracker.create({
        data: { userId }
      });
    }

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    const lastRequestDate = tracker.lastRequestAt?.toDateString() || '';
    if (lastRequestDate !== today) {
      tracker = await db.rateLimitTracker.update({
        where: { userId },
        data: { requestsToday: 0 }
      });
    }

    // Check daily limit
    if (tracker.requestsToday >= limits.requestsPerDay) {
      throw new Error(`Daily request limit exceeded: ${limits.requestsPerDay}/day`);
    }

    // Check monthly limit
    if (tracker.requestsThisMonth >= limits.requestsPerMonth) {
      throw new Error(`Monthly request limit exceeded: ${limits.requestsPerMonth}/month`);
    }

    // Increment counters
    tracker = await db.rateLimitTracker.update({
      where: { userId },
      data: {
        requestsToday: tracker.requestsToday + 1,
        requestsThisMonth: tracker.requestsThisMonth + 1,
        lastRequestAt: new Date()
      }
    });

    return {
      remaining: limits.requestsPerDay - tracker.requestsToday,
      limit: limits.requestsPerDay,
      reset: new Date(new Date().setHours(24, 0, 0, 0))
    };
  },

  async checkAndTrackAnalysis(userId: string, userTier: 'startup' | 'enterprise' | 'unlimited') {
    const limits = LIMITS[userTier];
    let tracker = await db.rateLimitTracker.findUnique({ where: { userId } });

    if (!tracker) {
      tracker = await db.rateLimitTracker.create({
        data: { userId }
      });
    }

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    const lastAnalysisDate = tracker.lastAnalysisAt?.toDateString() || '';
    if (lastAnalysisDate !== today) {
      tracker = await db.rateLimitTracker.update({
        where: { userId },
        data: { analysisRunsToday: 0 }
      });
    }

    // Check daily limit
    if (tracker.analysisRunsToday >= limits.analysisRunsPerDay) {
      throw new Error(
        `Daily analysis limit exceeded: ${limits.analysisRunsPerDay}/day. Upgrade your plan for more.`
      );
    }

    // Check monthly limit
    if (tracker.analysisRunsThisMonth >= limits.analysisRunsPerMonth) {
      throw new Error(
        `Monthly analysis limit exceeded: ${limits.analysisRunsPerMonth}/month. Upgrade your plan for more.`
      );
    }

    // Increment counters
    tracker = await db.rateLimitTracker.update({
      where: { userId },
      data: {
        analysisRunsToday: tracker.analysisRunsToday + 1,
        analysisRunsThisMonth: tracker.analysisRunsThisMonth + 1,
        lastAnalysisAt: new Date()
      }
    });

    return {
      remaining: limits.analysisRunsPerDay - tracker.analysisRunsToday,
      limit: limits.analysisRunsPerDay,
      reset: new Date(new Date().setHours(24, 0, 0, 0))
    };
  },

  async getUserLimits(userId: string, userTier: 'startup' | 'enterprise' | 'unlimited') {
    const limits = LIMITS[userTier];
    const tracker = await db.rateLimitTracker.findUnique({ where: { userId } });

    if (!tracker) {
      return {
        tier: userTier,
        requests: limits.requestsPerDay,
        requestsRemaining: limits.requestsPerDay,
        analysisRuns: limits.analysisRunsPerDay,
        analysisRunsRemaining: limits.analysisRunsPerDay
      };
    }

    return {
      tier: userTier,
      requests: limits.requestsPerDay,
      requestsRemaining: Math.max(0, limits.requestsPerDay - tracker.requestsToday),
      analysisRuns: limits.analysisRunsPerDay,
      analysisRunsRemaining: Math.max(0, limits.analysisRunsPerDay - tracker.analysisRunsToday)
    };
  }
};

export default RateLimitService;
