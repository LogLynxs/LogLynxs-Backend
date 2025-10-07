import { Router } from 'express';
import { badgeController } from './controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Badge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique badge identifier
 *         name:
 *           type: string
 *           description: Badge name
 *         description:
 *           type: string
 *           description: Badge description
 *         icon:
 *           type: string
 *           description: Badge icon emoji
 *         rarity:
 *           type: string
 *           enum: [common, rare, epic, legendary]
 *           description: Badge rarity level
 *         category:
 *           type: string
 *           enum: [mileage, maintenance, social, achievement]
 *           description: Badge category
 *         requirements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [total_mileage, bike_count, service_count, component_count, service_cost, days_active]
 *               value:
 *                 type: number
 *         isUnlocked:
 *           type: boolean
 *           description: Whether the badge is unlocked
 *         unlockedAt:
 *           type: number
 *           description: Timestamp when badge was unlocked
 *         progress:
 *           type: number
 *           description: Progress percentage (0-100)
 *     
 *     UserBadge:
 *       type: object
 *       properties:
 *         badgeId:
 *           type: string
 *         unlockedAt:
 *           type: number
 *         progress:
 *           type: number
 *     
 *     BadgeProgress:
 *       type: object
 *       properties:
 *         badgeId:
 *           type: string
 *         current:
 *           type: number
 *         target:
 *           type: number
 *         percentage:
 *           type: number
 */

/**
 * @swagger
 * /api/v1/badges:
 *   get:
 *     summary: Get all available badges
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all available badges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 badges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Badge'
 */
router.get('/', badgeController.getAllBadges);

/**
 * @swagger
 * /api/v1/users/{uid}/badges:
 *   get:
 *     summary: Get user's unlocked badges
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User's unlocked badges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 badges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Badge'
 *       403:
 *         description: Unauthorized to access user badges
 *       404:
 *         description: User not found
 */
router.get('/:uid/badges', badgeController.getUserBadges);

/**
 * @swagger
 * /api/v1/users/{uid}/badges/{badgeId}:
 *   get:
 *     summary: Get specific user badge
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge ID
 *     responses:
 *       200:
 *         description: User badge details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 badge:
 *                   $ref: '#/components/schemas/UserBadge'
 *       403:
 *         description: Unauthorized to access user badge
 *       404:
 *         description: Badge not found
 */
router.get('/:uid/badges/:badgeId', badgeController.getUserBadge);

/**
 * @swagger
 * /api/v1/users/{uid}/badges:
 *   post:
 *     summary: Unlock a badge for a user
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               badgeId:
 *                 type: string
 *                 description: Badge ID to unlock
 *             required:
 *               - badgeId
 *     responses:
 *       200:
 *         description: Badge unlocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized to unlock badge
 *       404:
 *         description: Badge not found
 */
router.post('/:uid/badges', badgeController.unlockBadge);

/**
 * @swagger
 * /api/v1/users/{uid}/badges/check:
 *   post:
 *     summary: Check and unlock badges for a user
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Badge check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 unlockedBadges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Badge'
 *                 count:
 *                   type: number
 *       403:
 *         description: Unauthorized to check badges
 */
router.post('/:uid/badges/check', badgeController.checkBadges);

/**
 * @swagger
 * /api/v1/users/{uid}/badges/progress:
 *   get:
 *     summary: Get badge progress for a user
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Badge progress for all badges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 progress:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BadgeProgress'
 *       403:
 *         description: Unauthorized to access badge progress
 */
router.get('/:uid/badges/progress', badgeController.getBadgeProgress);

export default router;
