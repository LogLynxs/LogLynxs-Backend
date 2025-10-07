import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/qr-codes/generate:
 *   post:
 *     summary: Generate QR code for bike or component
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code generated successfully
 */
router.post('/generate', (req, res) => {
  res.json({ message: 'Generate QR code endpoint - to be implemented' });
});

export default router;
