import request from 'supertest';
import express from 'express';
import authRoutes from '../auth';
import { DatabaseService } from '../../services/databaseService';

// Mock dependencies
jest.mock('../../services/databaseService');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            findUserByEmail: jest.fn(),
        };
        (DatabaseService as unknown as jest.Mock).mockImplementation(() => mockDb);
    });

    describe('GET /api/auth/me', () => {
        it('should return 401 if no token provided', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });
    });
});
