import { Router } from 'express';
import { notificationController } from './controller';

const router = Router();

router.post('/token', notificationController.registerToken);
router.delete('/token', notificationController.unregisterToken);

export default router;
