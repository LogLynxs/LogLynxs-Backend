import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../../firebase/admin';
import { CustomError } from '../../core/errorHandler';
import { logger } from '../../core/logger';
import { userService } from '../users/service';
import { AuthenticatedRequest } from '../../core/authMiddleware';
import { getFirestore } from '../../firebase/admin';

export const authController = {
  /**
   * Exchange Firebase ID token for API access
   */
  exchangeFirebaseToken: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firebaseToken, userData } = req.body;

      if (!firebaseToken) {
        throw new CustomError('Firebase token is required', 400, 'MISSING_TOKEN');
      }

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(firebaseToken);

      // Use provided user data or fall back to Firebase token data
      const displayName = userData?.displayName || decodedToken.name || '';
      const email = decodedToken.email || '';

      // Create or update user profile in Firestore
      try {
        await userService.createOrUpdateProfile(decodedToken.uid, {
          email: email,
          displayName: displayName
        });
      } catch (profileError) {
        logger.error('Failed to create/update user profile:', profileError);
        // Don't fail the auth if profile creation fails
        // The user can still authenticate, but profile features won't work
      }

      res.json({
        accessToken: firebaseToken, // Return the Firebase ID token for direct use
        expiresIn: 3600, // Firebase tokens typically last 1 hour
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh Firebase ID token
   */
  refreshToken: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new CustomError('Refresh token is required', 400, 'MISSING_TOKEN');
      }

      // For Firebase, we don't need a separate refresh token system
      // The client should get a fresh Firebase ID token
      res.status(400).json({
        error: 'Please get a fresh Firebase ID token from the client',
        code: 'REFRESH_NOT_SUPPORTED'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout user
   */
  logout: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // For Firebase, logout is handled on the client side
      // The server doesn't need to do anything special
      res.json({
        message: 'Logout successful',
        code: 'LOGOUT_SUCCESS'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user info
   */
  getCurrentUser: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      res.json({
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }
};
