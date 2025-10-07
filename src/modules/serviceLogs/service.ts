import { db } from '../../firebase/admin';
import { logger } from '../../core/logger';

export interface ServiceLog {
  id: string;
  bikeId: string;
  performedAt: Date;
  title: string;
  notes: string;
  cost: number;
  mileageAtService: number;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceLogData {
  bikeId: string;
  performedAt: Date;
  title: string;
  notes: string;
  cost: number;
  mileageAtService: number;
  items: string[];
}

export const serviceLogService = {
  /**
   * Get all service logs for a user, optionally filtered by bike
   */
  async getServiceLogs(ownerUid: string, bikeId?: string): Promise<ServiceLog[]> {
    try {
      // First, get all bikes owned by the user
      const bikesRef = db.collection('bikes');
      const bikesSnapshot = await bikesRef.where('ownerUid', '==', ownerUid).get();
      
      const bikeIds: string[] = [];
      bikesSnapshot.forEach(doc => {
        bikeIds.push(doc.id);
      });
      
      if (bikeIds.length === 0) {
        return [];
      }
      
      // Filter by specific bike if provided
      const targetBikeIds = bikeId ? [bikeId] : bikeIds;
      
      // Get service logs for all bikes (or specific bike)
      const serviceLogs: ServiceLog[] = [];
      
      for (const targetBikeId of targetBikeIds) {
        // Check if the bike belongs to the user
        if (!bikeIds.includes(targetBikeId)) {
          continue;
        }
        
        const serviceLogsRef = db.collection('service-logs');
        const snapshot = await serviceLogsRef
          .where('bikeId', '==', targetBikeId)
          .orderBy('performedAt', 'desc')
          .get();
        
        snapshot.forEach(doc => {
          const data = doc.data();
          serviceLogs.push({
            id: doc.id,
            bikeId: data.bikeId,
            performedAt: data.performedAt.toDate(),
            title: data.title,
            notes: data.notes,
            cost: data.cost,
            mileageAtService: data.mileageAtService,
            items: data.items || [],
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          });
        });
      }
      
      // Sort by performedAt descending
      serviceLogs.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
      
      logger.info(`Found ${serviceLogs.length} service logs for user ${ownerUid}${bikeId ? ` on bike ${bikeId}` : ''}`);
      return serviceLogs;
    } catch (error) {
      logger.error('Error getting service logs:', error);
      throw error;
    }
  },

  /**
   * Get recent service logs for a user
   */
  async getRecentServiceLogs(ownerUid: string, limit: number): Promise<ServiceLog[]> {
    try {
      const allLogs = await this.getServiceLogs(ownerUid);
      return allLogs.slice(0, limit);
    } catch (error) {
      logger.error('Error getting recent service logs:', error);
      throw error;
    }
  },

  /**
   * Get a specific service log by ID
   */
  async getServiceLog(ownerUid: string, logId: string): Promise<ServiceLog | null> {
    try {
      const serviceLogRef = db.collection('service-logs').doc(logId);
      const doc = await serviceLogRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      
      // Verify the bike belongs to the user
      const bikeRef = db.collection('bikes').doc(data.bikeId);
      const bikeDoc = await bikeRef.get();
      
      if (!bikeDoc.exists) {
        return null;
      }
      
      const bikeData = bikeDoc.data()!;
      if (bikeData.ownerUid !== ownerUid) {
        return null;
      }
      
      const serviceLog: ServiceLog = {
        id: doc.id,
        bikeId: data.bikeId,
        performedAt: data.performedAt.toDate(),
        title: data.title,
        notes: data.notes,
        cost: data.cost,
        mileageAtService: data.mileageAtService,
        items: data.items || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
      
      return serviceLog;
    } catch (error) {
      logger.error('Error getting service log:', error);
      throw error;
    }
  },

  /**
   * Create a new service log
   */
  async createServiceLog(ownerUid: string, logData: CreateServiceLogData): Promise<ServiceLog> {
    try {
      // Verify the bike belongs to the user
      const bikeRef = db.collection('bikes').doc(logData.bikeId);
      const bikeDoc = await bikeRef.get();
      
      if (!bikeDoc.exists) {
        throw new Error('Bike not found');
      }
      
      const bikeData = bikeDoc.data()!;
      if (bikeData.ownerUid !== ownerUid) {
        throw new Error('Bike does not belong to user');
      }
      
      const now = new Date();
      const serviceLogRef = db.collection('service-logs').doc();
      
      const serviceLog: Omit<ServiceLog, 'id'> = {
        bikeId: logData.bikeId,
        performedAt: logData.performedAt,
        title: logData.title,
        notes: logData.notes,
        cost: logData.cost,
        mileageAtService: logData.mileageAtService,
        items: logData.items,
        createdAt: now,
        updatedAt: now
      };
      
      await serviceLogRef.set(serviceLog);
      
      const createdServiceLog: ServiceLog = {
        id: serviceLogRef.id,
        ...serviceLog
      };
      
      logger.info(`Created service log ${serviceLogRef.id} for user ${ownerUid}`);
      return createdServiceLog;
    } catch (error) {
      logger.error('Error creating service log:', error);
      throw error;
    }
  },

  /**
   * Update a service log
   */
  async updateServiceLog(ownerUid: string, logId: string, updates: Partial<CreateServiceLogData>): Promise<ServiceLog | null> {
    try {
      // First, get the existing service log to verify ownership
      const existingLog = await this.getServiceLog(ownerUid, logId);
      if (!existingLog) {
        return null;
      }
      
      const serviceLogRef = db.collection('service-logs').doc(logId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await serviceLogRef.update(updateData);
      
      // Get the updated service log
      const updatedLog = await this.getServiceLog(ownerUid, logId);
      
      logger.info(`Updated service log ${logId} for user ${ownerUid}`);
      return updatedLog;
    } catch (error) {
      logger.error('Error updating service log:', error);
      throw error;
    }
  },

  /**
   * Delete a service log
   */
  async deleteServiceLog(ownerUid: string, logId: string): Promise<boolean> {
    try {
      // First, get the existing service log to verify ownership
      const existingLog = await this.getServiceLog(ownerUid, logId);
      if (!existingLog) {
        return false;
      }
      
      const serviceLogRef = db.collection('service-logs').doc(logId);
      await serviceLogRef.delete();
      
      logger.info(`Deleted service log ${logId} for user ${ownerUid}`);
      return true;
    } catch (error) {
      logger.error('Error deleting service log:', error);
      throw error;
    }
  }
};
