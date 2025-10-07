import { Router } from 'express';
import { authController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/firebase-exchange:
 *   post:
 *     summary: Exchange Firebase ID token for API access
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseToken
 *             properties:
 *               firebaseToken:
 *                 type: string
 *                 description: Firebase ID token from client
 *     responses:
 *       200:
 *         description: Successfully exchanged token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Firebase ID token for API access
 *                 expiresIn:
 *                   type: number
 *                   description: Token expiration time in seconds
 *       401:
 *         description: Invalid Firebase token
 */
router.post('/firebase-exchange', authController.exchangeFirebaseToken);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh Firebase ID token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (not used for Firebase)
 *     responses:
 *       400:
 *         description: Refresh not supported for Firebase
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 */
router.get('/me', authController.getCurrentUser);

export default router;
