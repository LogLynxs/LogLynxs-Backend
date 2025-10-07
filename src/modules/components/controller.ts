import { Request, Response, NextFunction } from 'express';
import { componentService } from './service';
import { CustomError } from '../../core/errorHandler';
import { logger } from '../../core/logger';
import { AuthenticatedRequest } from '../../core/authMiddleware';

export const componentController = {
  /**
   * Get all components for the authenticated user
   * If bikeId is provided, get components for that specific bike (regardless of ownership)
   */
  getComponents: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { bikeId } = req.query;
      
      logger.info(`Getting components for user: ${uid}${bikeId ? `, filtered by bike: ${bikeId}` : ''}`);
      
      let components;
      if (bikeId) {
        // If bikeId is provided, get components for that specific bike (public access)
        components = await componentService.getComponentsByBikeId(bikeId as string);
      } else {
        // If no bikeId, get user's own components
        components = await componentService.getComponents(uid);
      }
      
      res.json({
        success: true,
        components
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a specific component by ID
   */
  getComponent: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { componentId } = req.params;
      
      logger.info(`Getting component ${componentId} for user: ${uid}`);
      
      if (!componentId) {
        throw new CustomError('Component ID is required', 400, 'INVALID_INPUT');
      }
      const component = await componentService.getComponent(uid, componentId);
      
      if (!component) {
        throw new CustomError('Component not found', 404, 'COMPONENT_NOT_FOUND');
      }
      
      res.json({
        success: true,
        component
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new component
   */
  createComponent: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { kind, brand, model, spec, currentBikeId } = req.body;
      
      logger.info(`Creating component for user: ${uid}`);
      
      // Validate required fields
      if (!kind || !brand || !model || !spec) {
        throw new CustomError('Missing required fields: kind, brand, model, spec', 400, 'INVALID_INPUT');
      }
      
      const component = await componentService.createComponent(uid, {
        kind,
        brand,
        model,
        spec,
        currentBikeId
      });
      
      res.status(201).json({
        success: true,
        component
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a component
   */
  updateComponent: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { componentId } = req.params;
      const { kind, brand, model, spec, currentBikeId } = req.body;
      
      logger.info(`Updating component ${componentId} for user: ${uid}`);
      
      const updates: any = {};
      if (kind !== undefined) updates.kind = kind;
      if (brand !== undefined) updates.brand = brand;
      if (model !== undefined) updates.model = model;
      if (spec !== undefined) updates.spec = spec;
      if (currentBikeId !== undefined) updates.currentBikeId = currentBikeId;
      
      if (!componentId) {
        throw new CustomError('Component ID is required', 400, 'INVALID_INPUT');
      }
      const component = await componentService.updateComponent(uid, componentId, updates);
      
      if (!component) {
        throw new CustomError('Component not found', 404, 'COMPONENT_NOT_FOUND');
      }
      
      res.json({
        success: true,
        component
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a component
   */
  deleteComponent: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { componentId } = req.params;
      
      logger.info(`Deleting component ${componentId} for user: ${uid}`);
      
      if (!componentId) {
        throw new CustomError('Component ID is required', 400, 'INVALID_INPUT');
      }
      const deleted = await componentService.deleteComponent(uid, componentId);
      
      if (!deleted) {
        throw new CustomError('Component not found', 404, 'COMPONENT_NOT_FOUND');
      }
      
      res.json({
        success: true,
        message: 'Component deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Install a component on a bike
   */
  installComponent: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { componentId } = req.params;
      const { bikeId, installedOdometer } = req.body;
      
      logger.info(`Installing component ${componentId} on bike ${bikeId} for user: ${uid}`);
      
      if (!bikeId || installedOdometer === undefined) {
        throw new CustomError('Missing required fields: bikeId, installedOdometer', 400, 'INVALID_INPUT');
      }
      
      if (!componentId) {
        throw new CustomError('Component ID is required', 400, 'INVALID_INPUT');
      }
      if (!bikeId) {
        throw new CustomError('Bike ID is required', 400, 'INVALID_INPUT');
      }
      const result = await componentService.installComponent(uid, componentId, bikeId, installedOdometer);
      
      if (!result) {
        throw new CustomError('Component or bike not found', 404, 'NOT_FOUND');
      }
      
      res.json({
        success: true,
        message: 'Component installed successfully',
        component: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove a component from a bike
   */
  removeComponent: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.user!;
      const { componentId } = req.params;
      const { removedOdometer } = req.body;
      
      logger.info(`Removing component ${componentId} for user: ${uid}`);
      
      if (removedOdometer === undefined) {
        throw new CustomError('Missing required field: removedOdometer', 400, 'INVALID_INPUT');
      }
      
      if (!componentId) {
        throw new CustomError('Component ID is required', 400, 'INVALID_INPUT');
      }
      const result = await componentService.removeComponent(uid, componentId, removedOdometer);
      
      if (!result) {
        throw new CustomError('Component not found', 404, 'COMPONENT_NOT_FOUND');
      }
      
      res.json({
        success: true,
        message: 'Component removed successfully',
        component: result
      });
    } catch (error) {
      next(error);
    }
  }
};
