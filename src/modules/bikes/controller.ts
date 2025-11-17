import { Request, Response, NextFunction } from 'express';
import { bikeService } from './service';
import { CustomError } from '../../core/errorHandler';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../core/authMiddleware';

export const bikeController = {
  /**
   * Get all bikes for the authenticated user
   */
  getBikes: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      logger.info(`Getting bikes for user: ${uid}`);
      
      const bikes = await bikeService.getBikes(uid);
      
      res.json({
        success: true,
        bikes
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a specific bike by ID
   */
  getBike: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { bikeId } = req.params;
      
      logger.info(`Getting bike ${bikeId} for user: ${uid}`);
      
      if (!bikeId) {
        throw new CustomError('Bike ID is required', 400, 'INVALID_INPUT');
      }
      const bike = await bikeService.getBike(uid, bikeId);
      
      if (!bike) {
        throw new CustomError('Bike not found', 404, 'BIKE_NOT_FOUND');
      }
      
      res.json({
        success: true,
        bike
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new bike
   */
  createBike: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      
      logger.info(`Creating bike for user: ${uid}`);
      logger.info(`Raw request body:`, req.body);
      logger.info(`Request body type:`, typeof req.body);
      logger.info(`Request body keys:`, Object.keys(req.body || {}));
      
      const { name, brand, type, year, status, totalMileage, tags, photoUrl } = req.body;
      
      logger.info(`Received bike data:`, { name, brand, type, year, status, totalMileage, tags });
      
      // Validate required fields
      if (!name || !brand || !type || !year || !status || totalMileage === undefined) {
        logger.error(`Validation failed: name=${!!name}, brand=${!!brand}, type=${!!type}, year=${!!year}, status=${!!status}, totalMileage=${totalMileage}`);
        throw new CustomError('Missing required fields: name, brand, type, year, status, totalMileage', 400, 'INVALID_INPUT');
      }
      
      // Validate status enum
      const validStatuses = ['Excellent', 'Good', 'Needs Attention', 'Critical'];
      if (!validStatuses.includes(status)) {
        throw new CustomError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'INVALID_INPUT');
      }
      
      const bike = await bikeService.createBike(uid, {
        name,
        brand,
        type,
        year,
        status,
        totalMileage,
        tags: tags || [],
        photoUrl: photoUrl || null
      });
      
      res.status(201).json({
        success: true,
        bike
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a bike
   */
  updateBike: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { bikeId } = req.params;
      const { name, brand, type, year, status, totalMileage, tags, photoUrl } = req.body;
      
      logger.info(`Updating bike ${bikeId} for user: ${uid}`);
      
      // Validate status if provided
      if (status) {
        const validStatuses = ['Excellent', 'Good', 'Needs Attention', 'Critical'];
        if (!validStatuses.includes(status)) {
          throw new CustomError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'INVALID_INPUT');
        }
      }
      
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (brand !== undefined) updates.brand = brand;
      if (type !== undefined) updates.type = type;
      if (year !== undefined) updates.year = year;
      if (status !== undefined) updates.status = status;
      if (totalMileage !== undefined) updates.totalMileage = totalMileage;
      if (tags !== undefined) updates.tags = tags;
      if (photoUrl !== undefined) updates.photoUrl = photoUrl;
      
      if (!bikeId) {
        throw new CustomError('Bike ID is required', 400, 'INVALID_INPUT');
      }
      const bike = await bikeService.updateBike(uid, bikeId, updates);
      
      if (!bike) {
        throw new CustomError('Bike not found', 404, 'BIKE_NOT_FOUND');
      }
      
      res.json({
        success: true,
        bike
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a bike
   */
  deleteBike: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { bikeId } = req.params;
      
      logger.info(`Deleting bike ${bikeId} for user: ${uid}`);
      
      if (!bikeId) {
        throw new CustomError('Bike ID is required', 400, 'INVALID_INPUT');
      }
      const deleted = await bikeService.deleteBike(uid, bikeId);
      
      if (!deleted) {
        throw new CustomError('Bike not found', 404, 'BIKE_NOT_FOUND');
      }
      
      res.json({
        success: true,
        message: 'Bike deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Increment bike mileage
   */
  incrementMileage: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { bikeId } = req.params;
      const { deltaMi } = req.body;
      
      logger.info(`Incrementing mileage for bike ${bikeId} by ${deltaMi} miles`);
      
      if (!deltaMi || typeof deltaMi !== 'number' || deltaMi < 0) {
        throw new CustomError('deltaMi must be a positive number', 400, 'INVALID_INPUT');
      }
      
      if (!bikeId) {
        throw new CustomError('Bike ID is required', 400, 'INVALID_INPUT');
      }
      const bike = await bikeService.incrementMileage(uid, bikeId, deltaMi);
      
      if (!bike) {
        throw new CustomError('Bike not found', 404, 'BIKE_NOT_FOUND');
      }
      
      res.json({
        success: true,
        bike
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a bike by unique identifier (for QR code lookup)
   */
  getBikeByUniqueIdentifier: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uniqueIdentifier } = req.params;
      
      logger.info(`Looking up bike by unique identifier: ${uniqueIdentifier}`);
      
      if (!uniqueIdentifier) {
        throw new CustomError('Unique identifier is required', 400, 'INVALID_INPUT');
      }
      
      const bike = await bikeService.getBikeByUniqueIdentifier(uniqueIdentifier);
      
      if (!bike) {
        throw new CustomError('Bike not found', 404, 'BIKE_NOT_FOUND');
      }
      
      res.json({
        success: true,
        bike
      });
    } catch (error) {
      next(error);
    }
  }
};
