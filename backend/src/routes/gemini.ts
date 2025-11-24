import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { analysisRateLimitMiddleware } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * POST /api/gemini/analyze
 * Proxy Gemini API calls with proper authentication & rate limiting
 */
router.post(
  '/analyze',
  authMiddleware,
  analysisRateLimitMiddleware,
  async (req: AuthRequest, res: Response) => {
  const { prompt, systemInstruction, model = 'gemini-2.5-flash' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    const text = response.text || 'No response';

    res.json({
      text,
      model,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Gemini error:', err);
    res.status(500).json({
      error: 'Gemini API error',
      details: err.message
    });
  }
  }
);

/**
 * GET /api/gemini/models
 * List available Gemini models
 */
router.get('/models', authMiddleware, (_req: AuthRequest, res: Response) => {
  res.json({
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'default' },
      { id: 'gemini-pro', name: 'Gemini Pro', tier: 'premium' }
    ]
  });
});

export default router;
