import { Router } from 'express';
import { componentController } from './controller';
import { authMiddleware } from '../../core/authMiddleware';

const router = Router();

// All component routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Component:
 *       type: object
 *       required:
 *         - kind
 *         - brand
 *         - model
 *         - spec
 *       properties:
 *         kind:
 *           type: string
 *           description: Component type (chain, brake, tire, cassette, etc.)
 *         brand:
 *           type: string
 *           description: Component brand
 *         model:
 *           type: string
 *           description: Component model
 *         spec:
 *           type: object
 *           description: Component specifications
 *         currentBikeId:
 *           type: string
 *           nullable: true
 *           description: ID of bike currently using this component
 */

/**
 * @swagger
 * /api/v1/components:
 *   get:
 *     summary: Get all components for the authenticated user
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bikeId
 *         schema:
 *           type: string
 *         description: Filter components by bike ID
 *     responses:
 *       200:
 *         description: List of components retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 components:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Component'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', componentController.getComponents);

/**
 * @swagger
 * /api/v1/components/{componentId}:
 *   get:
 *     summary: Get a specific component by ID
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     responses:
 *       200:
 *         description: Component retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 component:
 *                   $ref: '#/components/schemas/Component'
 *       404:
 *         description: Component not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:componentId', componentController.getComponent);

/**
 * @swagger
 * /api/v1/components:
 *   post:
 *     summary: Create a new component
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Component'
 *     responses:
 *       201:
 *         description: Component created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 component:
 *                   $ref: '#/components/schemas/Component'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', componentController.createComponent);

/**
 * @swagger
 * /api/v1/components/{componentId}:
 *   put:
 *     summary: Update a component
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Component'
 *     responses:
 *       200:
 *         description: Component updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 component:
 *                   $ref: '#/components/schemas/Component'
 *       404:
 *         description: Component not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:componentId', componentController.updateComponent);

/**
 * @swagger
 * /api/v1/components/{componentId}:
 *   delete:
 *     summary: Delete a component
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     responses:
 *       200:
 *         description: Component deleted successfully
 *       404:
 *         description: Component not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:componentId', componentController.deleteComponent);

/**
 * @swagger
 * /api/v1/components/{componentId}/install:
 *   post:
 *     summary: Install a component on a bike
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bikeId
 *               - installedOdometer
 *             properties:
 *               bikeId:
 *                 type: string
 *                 description: ID of the bike to install the component on
 *               installedOdometer:
 *                 type: integer
 *                 description: Bike mileage at installation
 *     responses:
 *       200:
 *         description: Component installed successfully
 *       404:
 *         description: Component or bike not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:componentId/install', componentController.installComponent);

/**
 * @swagger
 * /api/v1/components/{componentId}/remove:
 *   post:
 *     summary: Remove a component from a bike
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - removedOdometer
 *             properties:
 *               removedOdometer:
 *                 type: integer
 *                 description: Bike mileage at removal
 *     responses:
 *       200:
 *         description: Component removed successfully
 *       404:
 *         description: Component not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:componentId/remove', componentController.removeComponent);

export default router;
