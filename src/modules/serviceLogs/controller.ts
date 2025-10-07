import { Request, Response, NextFunction } from 'express';
import { serviceLogService } from './service';
import { CustomError } from '../../core/errorHandler';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../core/authMiddleware';

export const serviceLogController = {
  /**
   * Get all service logs for the authenticated user
   */
  getServiceLogs: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { bikeId } = req.query;
      
      logger.info(`Getting service logs for user: ${uid}${bikeId ? `, filtered by bike: ${bikeId}` : ''}`);
      
      const serviceLogs = await serviceLogService.getServiceLogs(uid, bikeId as string);
      
      res.json({
        success: true,
        serviceLogs
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get recent service logs for the authenticated user
   */
  getRecentServiceLogs: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const limit = parseInt(req.query.limit as string) || 3;
      
      logger.info(`Getting recent service logs for user: ${uid}, limit: ${limit}`);
      
      const serviceLogs = await serviceLogService.getRecentServiceLogs(uid, limit);
      
      res.json({
        success: true,
        serviceLogs
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a specific service log by ID
   */
  getServiceLog: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { logId } = req.params;
      
      logger.info(`Getting service log ${logId} for user: ${uid}`);
      
      if (!logId) {
        throw new CustomError('Service log ID is required', 400, 'INVALID_INPUT');
      }
      const serviceLog = await serviceLogService.getServiceLog(uid, logId);
      
      if (!serviceLog) {
        throw new CustomError('Service log not found', 404, 'SERVICE_LOG_NOT_FOUND');
      }
      
      res.json({
        success: true,
        serviceLog
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new service log
   */
  createServiceLog: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { bikeId, performedAt, title, notes, cost, mileageAtService, items } = req.body;
      
      logger.info(`Creating service log for user: ${uid}`);
      
      // Validate required fields
      if (!bikeId || !performedAt || !title || !notes || cost === undefined || mileageAtService === undefined || !items) {
        throw new CustomError('Missing required fields: bikeId, performedAt, title, notes, cost, mileageAtService, items', 400, 'INVALID_INPUT');
      }
      
      const serviceLog = await serviceLogService.createServiceLog(uid, {
        bikeId,
        performedAt: new Date(performedAt),
        title,
        notes,
        cost,
        mileageAtService,
        items
      });
      
      res.status(201).json({
        success: true,
        serviceLog
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a service log
   */
  updateServiceLog: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { logId } = req.params;
      const { bikeId, performedAt, title, notes, cost, mileageAtService, items } = req.body;
      
      logger.info(`Updating service log ${logId} for user: ${uid}`);
      
      const updates: any = {};
      if (bikeId !== undefined) updates.bikeId = bikeId;
      if (performedAt !== undefined) updates.performedAt = new Date(performedAt);
      if (title !== undefined) updates.title = title;
      if (notes !== undefined) updates.notes = notes;
      if (cost !== undefined) updates.cost = cost;
      if (mileageAtService !== undefined) updates.mileageAtService = mileageAtService;
      if (items !== undefined) updates.items = items;
      
      if (!logId) {
        throw new CustomError('Service log ID is required', 400, 'INVALID_INPUT');
      }
      const serviceLog = await serviceLogService.updateServiceLog(uid, logId, updates);
      
      if (!serviceLog) {
        throw new CustomError('Service log not found', 404, 'SERVICE_LOG_NOT_FOUND');
      }
      
      res.json({
        success: true,
        serviceLog
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a service log
   */
  deleteServiceLog: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { logId } = req.params;
      
      logger.info(`Deleting service log ${logId} for user: ${uid}`);
      
      if (!logId) {
        throw new CustomError('Service log ID is required', 400, 'INVALID_INPUT');
      }
      const deleted = await serviceLogService.deleteServiceLog(uid, logId);
      
      if (!deleted) {
        throw new CustomError('Service log not found', 404, 'SERVICE_LOG_NOT_FOUND');
      }
      
      res.json({
        success: true,
        message: 'Service log deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
