import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', (req, res) => {
  res.json({ message: 'Get notifications endpoint - to be implemented' });
});

export default router;
