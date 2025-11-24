import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const db = prisma;

// Export useful helpers
export const DatabaseService = {
  async findUserByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  async findUserByGoogleId(googleId: string) {
    return db.user.findUnique({ where: { googleId } });
  },

  async createUser(data: any) {
    return db.user.create({ data });
  },

  async updateUser(id: string, data: any) {
    return db.user.update({
      where: { id },
      data
    });
  },

  async getUserWithCredits(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        credits: true,
        isUnlimited: true,
        createdAt: true
      }
    });
  },

  async createTransaction(data: any) {
    return db.transaction.create({ data });
  },

  async getTransactionHistory(userId: string, limit = 50) {
    return db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  async createAuditSession(data: any) {
    return db.auditSession.create({ data });
  },

  async getAuditHistory(userId: string, limit = 50) {
    return db.auditSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  async createStripeCustomer(userId: string, stripeCustomerId: string) {
    return db.stripeCustomer.create({
      data: {
        userId,
        stripeCustomerId
      }
    });
  },

  async getStripeCustomer(userId: string) {
    return db.stripeCustomer.findUnique({
      where: { userId }
    });
  },

  async updateStripeCustomer(userId: string, data: any) {
    return db.stripeCustomer.update({
      where: { userId },
      data
    });
  },

  async logAuditEvent(
    action: string,
    userId: string,
    details?: any,
    resourceType?: string,
    resourceId?: string,
    severity: string = 'info'
  ) {
    return db.auditLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details || {}),
        resourceType,
        resourceId,
        severity,
        ipAddress: undefined,
        userAgent: undefined
      }
    });
  },

  async closeConnection() {
    await db.$disconnect();
  }
};

export default DatabaseService;
