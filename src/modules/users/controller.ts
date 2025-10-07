import { Request, Response, NextFunction } from 'express';
import { userService, UserProfile } from './service';
import { CustomError } from '../../core/errorHandler';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../core/authMiddleware';

export const userController = {
  /**
   * Get current user's profile
   */
  getProfile: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      logger.info(`Getting profile for authenticated user: ${uid}`);
      
      const profile = await userService.getProfile(uid);
      
      if (!profile) {
        throw new CustomError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update current user's profile
   */
  updateProfile: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { displayName, email } = req.body;
      
      logger.info(`Updating profile for user: ${uid}`);
      
      // Validate input
      if (!displayName && !email) {
        throw new CustomError('At least one field must be provided for update', 400, 'INVALID_INPUT');
      }
      
      const updates: Partial<UserProfile> = {};
      if (displayName) updates.displayName = displayName;
      if (email) updates.email = email;
      
      const updatedProfile = await userService.updateProfile(uid, updates);
      
      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update current user's preferences
   */
  updatePreferences: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { darkMode, notificationsEnabled, biometricsEnabled } = req.body;
      
      logger.info(`⚙️ Updating preferences for user: ${uid}`);
      
      // Validate input
      if (!darkMode && notificationsEnabled === undefined && biometricsEnabled === undefined) {
        throw new CustomError('At least one preference must be provided for update', 400, 'INVALID_INPUT');
      }
      
      const prefs: Partial<UserProfile['prefs']> = {};
      if (darkMode) {
        if (!['system', 'light', 'dark'].includes(darkMode)) {
          throw new CustomError('Invalid darkMode value. Must be "system", "light", or "dark"', 400, 'INVALID_INPUT');
        }
        prefs.darkMode = darkMode;
      }
      if (notificationsEnabled !== undefined) prefs.notificationsEnabled = notificationsEnabled;
      if (biometricsEnabled !== undefined) prefs.biometricsEnabled = biometricsEnabled;
      
      const updatedProfile = await userService.updatePreferences(uid, prefs);
      
      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete current user's profile
   */
  deleteProfile: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      logger.info(`🗑️ Deleting profile for user: ${uid}`);
      
      await userService.deleteProfile(uid);
      
      res.json({
        success: true,
        message: 'User profile deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
