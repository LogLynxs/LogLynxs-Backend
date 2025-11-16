import { Request, Response, NextFunction } from 'express';
import { stravaService } from './service';
import { CustomError } from '../../core/errorHandler';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../core/authMiddleware';
import crypto from 'crypto';

export const stravaController = {
  /**
   * Get Strava authorization URL
   */
  getAuthUrl: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      // Generate state token for security
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store state in session or return it to client to verify on callback
      // For now, we'll include uid in state to verify ownership
      const stateWithUid = `${uid}:${state}`;
      
      const authUrl = stravaService.getAuthorizationUrl(stateWithUid);
      
      res.json({
        success: true,
        data: {
          authUrl,
          state
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handle Strava OAuth callback
   */
  handleCallback: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        throw new CustomError(`Strava authorization denied: ${error}`, 400, 'STRAVA_AUTH_DENIED');
      }

      if (!code || !state) {
        throw new CustomError('Missing code or state parameter', 400, 'INVALID_CALLBACK');
      }

      // Extract uid from state (format: "uid:randomState")
      const [uid, ...stateParts] = (state as string).split(':');
      if (!uid) {
        throw new CustomError('Invalid state parameter', 400, 'INVALID_STATE');
      }

      // Exchange code for token
      const tokenData = await stravaService.exchangeCodeForToken(code as string);

      // Save connection
      await stravaService.saveConnection(uid, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
        athleteId: tokenData.athlete.id.toString(),
        athleteName: `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
        createdAt: Date.now()
      });

      logger.info(`Strava account connected for user ${uid}`);

      // For mobile apps, redirect to deep link
      // The redirect URI should be set in the Strava app settings to: loglynx://strava/callback
      const redirectUrl = `loglynx://strava/callback?success=true&athleteId=${tokenData.athlete.id}`;

      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Strava connection status
   */
  getStatus: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      const connection = await stravaService.getConnection(uid);

      if (!connection) {
        res.json({
          success: true,
          data: {
            connected: false
          }
        });
        return;
      }

      // Check if token is still valid
      const now = Math.floor(Date.now() / 1000);
      const isExpired = connection.expiresAt <= now;

      res.json({
        success: true,
        data: {
          connected: true,
          athleteId: connection.athleteId,
          athleteName: connection.athleteName,
          lastSyncAt: connection.lastSyncAt,
          isExpired,
          expiresAt: connection.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Disconnect Strava account
   */
  disconnect: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      await stravaService.deleteConnection(uid);
      
      logger.info(`Strava account disconnected for user ${uid}`);

      res.json({
        success: true,
        message: 'Strava account disconnected successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Sync activities from Strava
   */
  syncActivities: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      logger.info(`Starting Strava activity sync for user ${uid}`);
      
      const result = await stravaService.syncActivities(uid);

      res.json({
        success: true,
        data: {
          synced: result.synced,
          skipped: result.skipped,
          message: `Synced ${result.synced} new activities, skipped ${result.skipped} existing activities`
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

