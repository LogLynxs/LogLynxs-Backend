import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/strava/connect:
 *   get:
 *     summary: Connect Strava account
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Strava connection initiated
 */
router.get('/connect', (req, res) => {
  res.json({ message: 'Strava connect endpoint - to be implemented' });
});

export default router;
