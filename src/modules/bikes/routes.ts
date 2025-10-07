import { Router } from 'express';
import { bikeController } from './controller';
import { authMiddleware } from '../../core/authMiddleware';

const router = Router();

// All bike routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Bike:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - year
 *         - status
 *         - totalMileage
 *       properties:
 *         name:
 *           type: string
 *           description: Bike name
 *         type:
 *           type: string
 *           description: Bike type (Road, Mountain, Hybrid, etc.)
 *         year:
 *           type: integer
 *           description: Manufacturing year
 *         status:
 *           type: string
 *           enum: [Excellent, Good, Needs Attention, Critical]
 *           description: Bike condition status
 *         totalMileage:
 *           type: integer
 *           description: Total miles ridden
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tags for the bike
 *         uniqueIdentifier:
 *           type: string
 *           description: Unique identifier for QR code generation
 */

/**
 * @swagger
 * /api/v1/bikes:
 *   get:
 *     summary: Get all bikes for the authenticated user
 *     tags: [Bikes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bikes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 bikes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bike'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', bikeController.getBikes);

/**
 * @swagger
 * /api/v1/bikes/lookup/{uniqueIdentifier}:
 *   get:
 *     summary: Get a bike by unique identifier (for QR code lookup)
 *     tags: [Bikes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uniqueIdentifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Bike unique identifier (QR code)
 *     responses:
 *       200:
 *         description: Bike retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 bike:
 *                   $ref: '#/components/schemas/Bike'
 *       404:
 *         description: Bike not found
 *       401:
 *         description: Unauthorized
 */
router.get('/lookup/:uniqueIdentifier', bikeController.getBikeByUniqueIdentifier);

/**
 * @swagger
 * /api/v1/bikes/{bikeId}:
 *   get:
 *     summary: Get a specific bike by ID
 *     tags: [Bikes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bikeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bike ID
 *     responses:
 *       200:
 *         description: Bike retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 bike:
 *                   $ref: '#/components/schemas/Bike'
 *       404:
 *         description: Bike not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:bikeId', bikeController.getBike);

/**
 * @swagger
 * /api/v1/bikes:
 *   post:
 *     summary: Create a new bike
 *     tags: [Bikes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bike'
 *     responses:
 *       201:
 *         description: Bike created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 bike:
 *                   $ref: '#/components/schemas/Bike'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', bikeController.createBike);

/**
 * @swagger
 * /api/v1/bikes/{bikeId}:
 *   put:
 *     summary: Update a bike
 *     tags: [Bikes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bikeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bike ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bike'
 *     responses:
 *       200:
 *         description: Bike updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 bike:
 *                   $ref: '#/components/schemas/Bike'
 *       404:
 *         description: Bike not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:bikeId', bikeController.updateBike);

/**
 * @swagger
 * /api/v1/bikes/{bikeId}:
 *   delete:
 *     summary: Delete a bike
 *     tags: [Bikes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bikeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bike ID
 *     responses:
 *       200:
 *         description: Bike deleted successfully
 *       404:
 *         description: Bike not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:bikeId', bikeController.deleteBike);

/**
 * @swagger
 * /api/v1/bikes/{bikeId}/mileage:
 *   put:
 *     summary: Increment bike mileage
 *     tags: [Bikes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bikeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bike ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deltaMi
 *             properties:
 *               deltaMi:
 *                 type: integer
 *                 description: Miles to add to the bike's total mileage
 *     responses:
 *       200:
 *         description: Mileage updated successfully
 *       404:
 *         description: Bike not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:bikeId/mileage', bikeController.incrementMileage);

export default router;
