import { DatabaseService, db } from './databaseService.js';

export const AdminService = {
  async getStats() {
    const totalUsers = await db.user.count();
    const activeSubscriptions = await db.stripeCustomer.count({
      where: { status: 'active' }
    });
    const totalTransactions = await db.transaction.count();
    const totalRevenue = await db.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'completed' }
    });

    const recentUsers = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    const recentAudits = await db.auditSession.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } }
    });

    return {
      metrics: {
        totalUsers,
        activeSubscriptions,
        totalTransactions,
        totalCreditsDebitedOrSpent: totalRevenue._sum.amount || 0
      },
      recentUsers,
      recentAudits
    };
  },

  async getAuditLogs(
    filters?: {
      userId?: string;
      action?: string;
      severity?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const logs = await db.auditLog.findMany({
      where: {
        userId: filters?.userId,
        action: filters?.action,
        severity: filters?.severity
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await db.auditLog.count({
      where: {
        userId: filters?.userId,
        action: filters?.action,
        severity: filters?.severity
      }
    });

    return { logs, total, limit, offset };
  },

  async getUserDetails(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        audits: { orderBy: { createdAt: 'desc' }, take: 20 },
        stripeCustomer: true
      }
    });

    if (!user) return null;

    const auditLogs = await db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return {
      ...user,
      auditLogs
    };
  },

  async suspendUser(userId: string, reason: string) {
    // Disable credits access
    await db.user.update({
      where: { id: userId },
      data: { credits: 0, isUnlimited: false }
    });

    await DatabaseService.logAuditEvent(
      'user_suspended',
      userId,
      { reason },
      'user',
      userId,
      'critical'
    );

    return { success: true };
  },

  async reactivateUser(userId: string) {
    await db.user.update({
      where: { id: userId },
      data: { credits: 400 }
    });

    await DatabaseService.logAuditEvent(
      'user_reactivated',
      userId,
      {},
      'user',
      userId,
      'warning'
    );

    return { success: true };
  },

  async getUsageAnalytics() {
    const topUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        _count: { select: { audits: true } }
      },
      orderBy: { audits: { _count: 'desc' } },
      take: 20
    });

    const auditsByTier = await db.auditSession.groupBy({
      by: ['tier'],
      _count: true
    });

    const transactionsByStatus = await db.transaction.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true }
    });

    return {
      topUsers,
      auditsByTier,
      transactionsByStatus
    };
  }
};

export default AdminService;
