import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { agentService } from '../services/agentService.js';
import { DatabaseService } from '../services/databaseService.js';

const router = express.Router();

/**
 * POST /api/agents/start
 * Start a new agent session
 */
router.post('/start', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { goal, role, files } = req.body;

        if (!goal) {
            return res.status(400).json({ error: 'Goal is required' });
        }

        // Fetch user to get API Key
        const user = await DatabaseService.getUserWithCredits(req.user!.id);

        if (!user || !user.geminiApiKey) {
            return res.status(400).json({
                error: 'Gemini API Key is required. Please set it in your profile settings.'
            });
        }

        const session = agentService.startAgent(goal, role || 'Assistant', files || [], user.geminiApiKey);

        res.json({
            sessionId: session.id,
            status: session.status,
            message: 'Agent started successfully'
        });
    } catch (error: any) {
        console.error('Error starting agent:', error);
        res.status(500).json({ error: 'Failed to start agent' });
    }
});

/**
 * GET /api/agents/:id
 * Get agent session status and results
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const session = agentService.getSession(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

export default router;
