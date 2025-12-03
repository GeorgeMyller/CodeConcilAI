import { AgentService, AgentStatus } from '../agentService';
import { DatabaseService } from '../databaseService';
import { GoogleGenAI } from '@google/genai';

// Mock dependencies
jest.mock('../databaseService');
jest.mock('@google/genai');

describe('AgentService', () => {
    let agentService: AgentService;
    let mockDb: any;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        // Setup mocks
        mockDb = {
            findUserByEmail: jest.fn(),
            updateUserApiKey: jest.fn(),
            getUserWithCredits: jest.fn(),
        };
        (DatabaseService as unknown as jest.Mock).mockImplementation(() => mockDb);

        agentService = new AgentService();
    });

    describe('startAgent', () => {
        it('should create a new session and start the agent loop', () => {
            const goal = 'Test Goal';
            const role = 'Tester';
            const files = [{ name: 'test.ts', content: 'code' }];

            const session = agentService.startAgent(goal, role, files);

            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.goal).toBe(goal);
            expect(session.role).toBe(role);
            expect(session.status).toBe(AgentStatus.RUNNING);
        });
    });

    describe('getSession', () => {
        it('should return undefined for non-existent session', () => {
            const session = agentService.getSession('fake-id');
            expect(session).toBeUndefined();
        });

        it('should return the session if it exists', () => {
            const session = agentService.startAgent('Goal', 'Role', []);
            const retrieved = agentService.getSession(session.id);
            expect(retrieved).toBe(session);
        });
    });
});
