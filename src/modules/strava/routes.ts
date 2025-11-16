import { Router } from 'express';
import { stravaController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/v1/strava/auth-url:
 *   get:
 *     summary: Get Strava OAuth authorization URL
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorization URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 *                     state:
 *                       type: string
 */
router.get('/auth-url', stravaController.getAuthUrl);

/**
 * Note: /callback route is registered separately in app.ts without auth middleware
 * because Strava redirects there without authentication
 */

/**
 * @swagger
 * /api/v1/strava/status:
 *   get:
 *     summary: Get Strava connection status
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     athleteId:
 *                       type: string
 *                     athleteName:
 *                       type: string
 *                     lastSyncAt:
 *                       type: number
 */
router.get('/status', stravaController.getStatus);

/**
 * @swagger
 * /api/v1/strava/disconnect:
 *   post:
 *     summary: Disconnect Strava account
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully disconnected
 */
router.post('/disconnect', stravaController.disconnect);

/**
 * @swagger
 * /api/v1/strava/sync:
 *   post:
 *     summary: Sync activities from Strava
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activities synced
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     synced:
 *                       type: number
 *                     skipped:
 *                       type: number
 */
router.post('/sync', stravaController.syncActivities);

export default router;
