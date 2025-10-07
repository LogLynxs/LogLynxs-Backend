import { Request, Response, NextFunction } from 'express';
import { badgeService } from './service';
import { CustomError } from '../../core/errorHandler';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../core/authMiddleware';

export const badgeController = {
  /**
   * Get all available badges
   * @route GET /api/v1/badges
   */
  getAllBadges: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Getting all badge definitions');
      
      const badges = await badgeService.getAllBadges();
      
      res.json({
        success: true,
        badges
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user's badges
   * @route GET /api/v1/users/:uid/badges
   */
  getUserBadges: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.params;
      const currentUserUid = req.user!.uid;
      
      // Users can only access their own badges
      if (uid !== currentUserUid) {
        throw new CustomError('Unauthorized to access user badges', 403, 'UNAUTHORIZED');
      }
      
      logger.info(`Getting badges for user: ${uid}`);

      // Run server-side check first so results are always up to date
      try {
      logger.info(`Auto-checking badges before returning list for ${uid}`);
        await badgeService.checkAndUnlockBadges(uid);
      } catch (e) {
        logger.warn(`Badge auto-check failed for ${uid}: ${String(e)}`);
      }

      const badges = await badgeService.getUserBadges(uid);
      
      res.json({
        success: true,
        badges
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get specific user badge
   * @route GET /api/v1/users/:uid/badges/:badgeId
   */
  getUserBadge: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid, badgeId } = req.params;
      const currentUserUid = req.user!.uid;
      
      // Users can only access their own badges
      if (uid !== currentUserUid) {
        throw new CustomError('Unauthorized to access user badge', 403, 'UNAUTHORIZED');
      }
      
      if (!badgeId) {
        throw new CustomError('Badge ID is required', 400, 'INVALID_INPUT');
      }
      
      logger.info(`Getting badge ${badgeId} for user: ${uid}`);
      
      const badge = await badgeService.getUserBadge(uid, badgeId);
      
      if (!badge) {
        throw new CustomError('Badge not found', 404, 'BADGE_NOT_FOUND');
      }
      
      res.json({
        success: true,
        badge
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Unlock a badge for a user
   * @route POST /api/v1/users/:uid/badges
   */
  unlockBadge: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.params;
      const { badgeId } = req.body;
      const currentUserUid = req.user!.uid;
      
      // Users can only unlock their own badges
      if (uid !== currentUserUid) {
        throw new CustomError('Unauthorized to unlock badge', 403, 'UNAUTHORIZED');
      }
      
      if (!badgeId) {
        throw new CustomError('Badge ID is required', 400, 'INVALID_INPUT');
      }
      
      logger.info(`Unlocking badge ${badgeId} for user: ${uid}`);
      
      const success = await badgeService.unlockBadge(uid, badgeId);
      
      if (!success) {
        throw new CustomError('Failed to unlock badge', 500, 'UNLOCK_FAILED');
      }
      
      res.json({
        success: true,
        message: 'Badge unlocked successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Check and unlock badges for a user
   * @route POST /api/v1/users/:uid/badges/check
   */
  checkBadges: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.params;
      const currentUserUid = req.user!.uid;
      
      // Users can only check their own badges
      if (uid !== currentUserUid) {
        throw new CustomError('Unauthorized to check badges', 403, 'UNAUTHORIZED');
      }
      
      logger.info(`Checking badges for user: ${uid}`);
      
      const unlockedBadges = await badgeService.checkAndUnlockBadges(uid);
      
      res.json({
        success: true,
        unlockedBadges,
        count: unlockedBadges.length
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get badge progress for a user
   * @route GET /api/v1/users/:uid/badges/progress
   */
  getBadgeProgress: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.params;
      const currentUserUid = req.user!.uid;
      
      // Users can only access their own badge progress
      if (uid !== currentUserUid) {
        throw new CustomError('Unauthorized to access badge progress', 403, 'UNAUTHORIZED');
      }
      
      logger.info(`📈 Getting badge progress for user: ${uid}`);
      
      const progress = await badgeService.getBadgeProgress(uid);
      
      res.json({
        success: true,
        progress
      });
    } catch (error) {
      next(error);
    }
  }
};
