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

/**
 * @swagger
 * /api/v1/strava/activities:
 *   get:
 *     summary: Get all synced Strava activities
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of synced activities
 */
router.get('/activities', stravaController.getActivities);

/**
 * @swagger
 * /api/v1/strava/activities/raw:
 *   get:
 *     summary: Get raw activities from Strava API (for debugging)
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Raw Strava API response
 */
router.get('/activities/raw', stravaController.getRawActivities);

export default router;
