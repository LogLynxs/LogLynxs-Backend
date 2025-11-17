import { Response, NextFunction } from 'express';
import { notificationService } from './service';
import { AuthenticatedRequest } from '../../core/authMiddleware';
import { CustomError } from '../../core/errorHandler';

export const notificationController = {
  registerToken: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, platform } = req.body;
      const uid = req.user?.uid;

      if (!uid) {
        throw new CustomError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      if (!token) {
        throw new CustomError('Device token is required', 400, 'INVALID_INPUT');
      }

      await notificationService.saveDeviceToken(uid, token, platform || 'android');

      res.json({
        success: true,
        message: 'Device token registered'
      });
    } catch (error) {
      next(error);
    }
  },

  unregisterToken: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      const uid = req.user?.uid;

      if (!uid) {
        throw new CustomError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      if (!token) {
        throw new CustomError('Device token is required', 400, 'INVALID_INPUT');
      }

      await notificationService.removeDeviceToken(uid, token);

      res.json({
        success: true,
        message: 'Device token removed'
      });
    } catch (error) {
      next(error);
    }
  }
};

