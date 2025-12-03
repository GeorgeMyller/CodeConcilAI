
import { AgentResult, AuditSession, UserProfile } from '../types';

/**
 * BACKEND SIMULATION SERVICE
 * 
 * In a production environment, this would be a Node.js/Python server connecting to PostgreSQL/Firebase.
 * For this browser-based architecture, we implement the "Backend Pattern" using LocalStorage
 * to persist data, manage sessions, and handle "billing" logic securely.
 */

const DB_KEYS = {
  USER: 'cc_user_v1',
  HISTORY: 'cc_history_v1',
  CREDITS: 'cc_credits_v1'
};

// 5 Startup Audits (50ea) + 1 Enterprise Audit (150ea) = 250 + 150 = 400
const INITIAL_CREDITS = 400;

export const Backend = {

  /**
   * AUTHENTICATION MODULE
   */
  auth: {
    login: async (): Promise<UserProfile> => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch user');

        const user = await response.json();
        return {
          ...user,
          avatar: user.picture || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'
        };
      } catch (e) {
        console.error('Login check failed', e);
        return null;
      }
    },

    logout: async () => {
      localStorage.removeItem('token');
      return true;
    },

    saveApiKey: async (apiKey: string): Promise<void> => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey })
      });

      if (!response.ok) throw new Error('Failed to save API key');
    },

    googleLogin: async (idToken: string): Promise<UserProfile> => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) throw new Error('Google login failed');

      const data = await response.json();
      localStorage.setItem('token', data.token);

      return {
        ...data.user,
        avatar: data.user.picture || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'
      };
    },

    updateCredits: (credits: number) => {
      const stored = localStorage.getItem(DB_KEYS.USER);
      if (stored) {
        const user = JSON.parse(stored);
        user.credits = credits;
        localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
      }
    }
  },

  /**
   * DATABASE MODULE (History/Persistence)
   */
  db: {
    saveAudit: async (session: Omit<AuditSession, 'id' | 'timestamp'>): Promise<AuditSession> => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate write latency

      const newRecord: AuditSession = {
        ...session,
        id: 'aud_' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      };

      const history = Backend.db.getHistorySync();
      const updatedHistory = [newRecord, ...history];

      localStorage.setItem(DB_KEYS.HISTORY, JSON.stringify(updatedHistory));
      return newRecord;
    },

    getHistory: async (): Promise<AuditSession[]> => {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate read latency
      return Backend.db.getHistorySync();
    },

    // Internal synchronous helper
    getHistorySync: (): AuditSession[] => {
      const data = localStorage.getItem(DB_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    }
  },

  /**
   * BILLING MODULE
   */
  billing: {
    getCosts: () => ({
      startup: 50,
      enterprise: 150
    }),

    processTransaction: async (userId: string, cost: number): Promise<boolean> => {
      const stored = localStorage.getItem(DB_KEYS.USER);
      if (!stored) throw new Error("User not found");

      const user = JSON.parse(stored);

      // If user is in BYOK (Bring Your Own Key) Unlimited mode, they don't consume platform credits
      if (user.isUnlimited) {
        return true;
      }

      if (user.credits < cost) {
        return false;
      }

      user.credits -= cost;
      localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
      return true;
    },

    upgradeToUnlimited: async (userId: string): Promise<UserProfile> => {
      const stored = localStorage.getItem(DB_KEYS.USER);
      if (!stored) throw new Error("User not found");

      const user = JSON.parse(stored);
      user.isUnlimited = true;
      // Visual sugar: set credits to 0 as they are no longer relevant
      user.credits = 0;

      localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
      return user;
    }
  }
};
