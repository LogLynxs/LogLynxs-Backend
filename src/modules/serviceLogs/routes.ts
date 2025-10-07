import { Router } from 'express';
import { serviceLogController } from './controller';
import { authMiddleware } from '../../core/authMiddleware';

const router = Router();

// All service log routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceLog:
 *       type: object
 *       required:
 *         - bikeId
 *         - performedAt
 *         - title
 *         - notes
 *         - cost
 *         - mileageAtService
 *         - items
 *       properties:
 *         bikeId:
 *           type: string
 *           description: ID of the bike this service was performed on
 *         performedAt:
 *           type: string
 *           format: date-time
 *           description: When the service was performed
 *         title:
 *           type: string
 *           description: Service title
 *         notes:
 *           type: string
 *           description: Service notes
 *         cost:
 *           type: number
 *           description: Service cost
 *         mileageAtService:
 *           type: integer
 *           description: Bike mileage when service was performed
 *         items:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of service items performed
 */

/**
 * @swagger
 * /api/v1/service-logs:
 *   get:
 *     summary: Get all service logs for the authenticated user
 *     tags: [Service Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bikeId
 *         schema:
 *           type: string
 *         description: Filter service logs by bike ID
 *     responses:
 *       200:
 *         description: List of service logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 serviceLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServiceLog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', serviceLogController.getServiceLogs);

/**
 * @swagger
 * /api/v1/service-logs/recent:
 *   get:
 *     summary: Get recent service logs for the authenticated user
 *     tags: [Service Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Number of recent logs to return
 *     responses:
 *       200:
 *         description: Recent service logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 serviceLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServiceLog'
 *       401:
 *         description: Unauthorized
 */
router.get('/recent', serviceLogController.getRecentServiceLogs);

/**
 * @swagger
 * /api/v1/service-logs/{logId}:
 *   get:
 *     summary: Get a specific service log by ID
 *     tags: [Service Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service log ID
 *     responses:
 *       200:
 *         description: Service log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 serviceLog:
 *                   $ref: '#/components/schemas/ServiceLog'
 *       404:
 *         description: Service log not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:logId', serviceLogController.getServiceLog);

/**
 * @swagger
 * /api/v1/service-logs:
 *   post:
 *     summary: Create a new service log
 *     tags: [Service Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceLog'
 *     responses:
 *       201:
 *         description: Service log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 serviceLog:
 *                   $ref: '#/components/schemas/ServiceLog'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', serviceLogController.createServiceLog);

/**
 * @swagger
 * /api/v1/service-logs/{logId}:
 *   put:
 *     summary: Update a service log
 *     tags: [Service Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceLog'
 *     responses:
 *       200:
 *         description: Service log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 serviceLog:
 *                   $ref: '#/components/schemas/ServiceLog'
 *       404:
 *         description: Service log not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:logId', serviceLogController.updateServiceLog);

/**
 * @swagger
 * /api/v1/service-logs/{logId}:
 *   delete:
 *     summary: Delete a service log
 *     tags: [Service Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service log ID
 *     responses:
 *       200:
 *         description: Service log deleted successfully
 *       404:
 *         description: Service log not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:logId', serviceLogController.deleteServiceLog);

export default router;
