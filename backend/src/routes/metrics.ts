import { Router } from 'express';
import { getMetricsRegistry } from '../services/metricsService.js';

const router = Router();

// Prometheus metrics endpoint
router.get('/metrics', async (_req, res) => {
  try {
    const registry = getMetricsRegistry();
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

export default router;
