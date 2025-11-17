import { db } from '../../firebase/admin';
import { logger } from '../../core/logger';

/**
 * Generate a unique identifier for QR codes
 * Format: LYNX-XXXX-XXXX-XXXX (where X is alphanumeric)
 */
function generateUniqueIdentifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Math.random;
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(random() * chars.length)]).join('');
  const part3 = Array.from({ length: 4 }, () => chars[Math.floor(random() * chars.length)]).join('');
  return `LYNX-${part1}-${part2}-${part3}`;
}

export interface Bike {
  id: string;
  ownerUid: string;
  name: string;
  brand: string;
  type: string;
  year: number;
  status: string;
  totalMileage: number;
  tags: string[];
  uniqueIdentifier: string;
  photoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBikeData {
  name: string;
  brand: string;
  type: string;
  year: number;
  status: string;
  totalMileage: number;
  tags: string[];
  uniqueIdentifier?: string;
  photoUrl?: string | null;
}

export const bikeService = {
  /**
   * Get all bikes for a user
   */
  async getBikes(ownerUid: string): Promise<Bike[]> {
    try {
      const bikesRef = db.collection('bikes');
      const snapshot = await bikesRef.where('ownerUid', '==', ownerUid).get();
      
      const bikes: Bike[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        bikes.push({
          id: doc.id,
          ownerUid: data.ownerUid,
          name: data.name,
          brand: data.brand || '',
          type: data.type,
          year: data.year,
          status: data.status,
          totalMileage: data.totalMileage,
          tags: data.tags || [],
          uniqueIdentifier: data.uniqueIdentifier || '',
        photoUrl: data.photoUrl || null,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });
      
      logger.info(`Found ${bikes.length} bikes for user ${ownerUid}`);
      return bikes;
    } catch (error) {
      logger.error('Error getting bikes:', error);
      throw error;
    }
  },

  /**
   * Get a specific bike by ID
   */
  async getBike(ownerUid: string, bikeId: string): Promise<Bike | null> {
    try {
      const bikeRef = db.collection('bikes').doc(bikeId);
      const doc = await bikeRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      
      // Check if the bike belongs to the user
      if (data.ownerUid !== ownerUid) {
        return null;
      }
      
      const bike: Bike = {
        id: doc.id,
        ownerUid: data.ownerUid,
        name: data.name,
        brand: data.brand || '',
        type: data.type,
        year: data.year,
        status: data.status,
        totalMileage: data.totalMileage,
        tags: data.tags || [],
        uniqueIdentifier: data.uniqueIdentifier || '',
        photoUrl: data.photoUrl || null,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
      
      return bike;
    } catch (error) {
      logger.error('Error getting bike:', error);
      throw error;
    }
  },



  /**
   * Create a new bike
   */
  async createBike(ownerUid: string, bikeData: CreateBikeData): Promise<Bike> {
    try {
      const now = new Date();
      const bikeRef = db.collection('bikes').doc();
      
      // Generate unique identifier if not provided
      const uniqueIdentifier = bikeData.uniqueIdentifier || generateUniqueIdentifier();
      
      const bike: Omit<Bike, 'id'> = {
        ownerUid,
        name: bikeData.name,
        brand: bikeData.brand,
        type: bikeData.type,
        year: bikeData.year,
        status: bikeData.status,
        totalMileage: bikeData.totalMileage,
        tags: bikeData.tags,
        uniqueIdentifier,
        photoUrl: bikeData.photoUrl || null,
        createdAt: now,
        updatedAt: now
      };
      
      await bikeRef.set(bike);
      
      const createdBike: Bike = {
        id: bikeRef.id,
        ...bike
      };
      
      logger.info(`Created bike ${bikeRef.id} with unique identifier ${uniqueIdentifier} for user ${ownerUid}`);
      return createdBike;
    } catch (error) {
      logger.error('Error creating bike:', error);
      throw error;
    }
  },

  /**
   * Update a bike
   */
  async updateBike(ownerUid: string, bikeId: string, updates: Partial<CreateBikeData>): Promise<Bike | null> {
    try {
      const bikeRef = db.collection('bikes').doc(bikeId);
      const doc = await bikeRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      
      // Check if the bike belongs to the user
      if (data.ownerUid !== ownerUid) {
        return null;
      }
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await bikeRef.update(updateData);
      
      // Get the updated bike
      const updatedDoc = await bikeRef.get();
      const updatedData = updatedDoc.data()!;
      
      const bike: Bike = {
        id: bikeId,
        ownerUid: updatedData.ownerUid,
        name: updatedData.name,
        brand: updatedData.brand || '',
        type: updatedData.type,
        year: updatedData.year,
        status: updatedData.status,
        totalMileage: updatedData.totalMileage,
        tags: updatedData.tags || [],
        uniqueIdentifier: updatedData.uniqueIdentifier || '',
        photoUrl: updatedData.photoUrl || null,
        createdAt: updatedData.createdAt.toDate(),
        updatedAt: updatedData.updatedAt.toDate()
      };
      
      logger.info(`Updated bike ${bikeId} for user ${ownerUid}`);
      return bike;
    } catch (error) {
      logger.error('Error updating bike:', error);
      throw error;
    }
  },

  /**
   * Delete a bike
   */
  async deleteBike(ownerUid: string, bikeId: string): Promise<boolean> {
    try {
      const bikeRef = db.collection('bikes').doc(bikeId);
      const doc = await bikeRef.get();
      
      if (!doc.exists) {
        return false;
      }
      
      const data = doc.data()!;
      
      // Check if the bike belongs to the user
      if (data.ownerUid !== ownerUid) {
        return false;
      }
      
      await bikeRef.delete();
      
      logger.info(`Deleted bike ${bikeId} for user ${ownerUid}`);
      return true;
    } catch (error) {
      logger.error('Error deleting bike:', error);
      throw error;
    }
  },

  /**
   * Increment bike mileage
   */
  async incrementMileage(ownerUid: string, bikeId: string, deltaMi: number): Promise<Bike | null> {
    try {
      const bikeRef = db.collection('bikes').doc(bikeId);
      const doc = await bikeRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      
      // Check if the bike belongs to the user
      if (data.ownerUid !== ownerUid) {
        return null;
      }
      
      const newMileage = data.totalMileage + deltaMi;
      
      await bikeRef.update({
        totalMileage: newMileage,
        updatedAt: new Date()
      });
      
      // Get the updated bike
      const updatedDoc = await bikeRef.get();
      const updatedData = updatedDoc.data()!;
      
      const bike: Bike = {
        id: bikeId,
        ownerUid: updatedData.ownerUid,
        name: updatedData.name,
        brand: updatedData.brand || '',
        type: updatedData.type,
        year: updatedData.year,
        status: updatedData.status,
        totalMileage: updatedData.totalMileage,
        tags: updatedData.tags || [],
        uniqueIdentifier: updatedData.uniqueIdentifier || '',
        photoUrl: updatedData.photoUrl || null,
        createdAt: updatedData.createdAt.toDate(),
        updatedAt: updatedData.updatedAt.toDate()
      };
      
      logger.info(`Incremented mileage for bike ${bikeId} by ${deltaMi} miles (new total: ${newMileage})`);
      return bike;
    } catch (error) {
      logger.error('Error incrementing bike mileage:', error);
      throw error;
    }
  },

  /**
   * Get a bike by unique identifier (for QR code lookup)
   */
  async getBikeByUniqueIdentifier(uniqueIdentifier: string): Promise<Bike | null> {
    try {
      const bikesRef = db.collection('bikes');
      const snapshot = await bikesRef.where('uniqueIdentifier', '==', uniqueIdentifier).get();
      
      if (snapshot.empty) {
        logger.info(`No bike found with unique identifier: ${uniqueIdentifier}`);
        return null;
      }
      
      const doc = snapshot.docs[0];
      if (!doc) {
        logger.info(`No bike found with unique identifier: ${uniqueIdentifier}`);
        return null;
      }
      
      const data = doc.data();
      
      const bike: Bike = {
        id: doc.id,
        ownerUid: data.ownerUid,
        name: data.name,
        brand: data.brand || '',
        type: data.type,
        year: data.year,
        status: data.status,
        totalMileage: data.totalMileage,
        tags: data.tags || [],
        uniqueIdentifier: data.uniqueIdentifier || '',
        photoUrl: data.photoUrl || null,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
      
      logger.info(`Found bike ${doc.id} with unique identifier: ${uniqueIdentifier}`);
      return bike;
    } catch (error) {
      logger.error('Error getting bike by unique identifier:', error);
      throw error;
    }
  }
};
