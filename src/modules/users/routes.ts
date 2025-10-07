import { Router } from 'express';
import { userController } from './controller';
import { authMiddleware } from '../../core/authMiddleware';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/preferences', userController.updatePreferences);
router.delete('/profile', userController.deleteProfile);

export default router;
