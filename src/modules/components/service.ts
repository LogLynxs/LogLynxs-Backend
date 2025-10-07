import { db } from '../../firebase/admin';
import { logger } from '../../core/logger';

export interface Component {
  id: string;
  ownerUid: string;
  kind: string;
  brand: string;
  model: string;
  spec: Record<string, any>;
  currentBikeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComponentData {
  kind: string;
  brand: string;
  model: string;
  spec: Record<string, any>;
  currentBikeId?: string | null;
}

export interface InstallationRecord {
  bikeId: string;
  installedAt: Date;
  installedOdometer: number;
  removedAt?: Date;
  removedOdometer?: number;
}

export const componentService = {
  /**
   * Get all components for a user, optionally filtered by bike
   */
  async getComponents(ownerUid: string, bikeId?: string): Promise<Component[]> {
    try {
      const componentsRef = db.collection('components');
      let query = componentsRef.where('ownerUid', '==', ownerUid);
      
      if (bikeId) {
        query = query.where('currentBikeId', '==', bikeId);
      }
      
      const snapshot = await query.get();
      
      const components: Component[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        components.push({
          id: doc.id,
          ownerUid: data.ownerUid,
          kind: data.kind,
          brand: data.brand,
          model: data.model,
          spec: data.spec,
          currentBikeId: data.currentBikeId || null,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });
      
      logger.info(`Found ${components.length} components for user ${ownerUid}${bikeId ? ` on bike ${bikeId}` : ''}`);
      return components;
    } catch (error) {
      logger.error('Error getting components:', error);
      throw error;
    }
  },

  /**
   * Get all components for a specific bike (public access)
   */
  async getComponentsByBikeId(bikeId: string): Promise<Component[]> {
    try {
      logger.info(`Getting components for bike: ${bikeId}`);
      
      // First, get the bike to find the owner
      const bikeRef = db.collection('bikes').doc(bikeId);
      const bikeDoc = await bikeRef.get();
      
      if (!bikeDoc.exists) {
        throw new Error('Bike not found');
      }
      
      const bikeData = bikeDoc.data();
      const ownerUid = bikeData?.ownerUid;
      
      if (!ownerUid) {
        throw new Error('Bike owner not found');
      }
      
      // Get components for this bike
      const componentsRef = db.collection('components');
      const query = componentsRef.where('ownerUid', '==', ownerUid).where('currentBikeId', '==', bikeId);
      const snapshot = await query.get();
      
      const components: Component[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        components.push({
          id: doc.id,
          ownerUid: data.ownerUid,
          kind: data.kind,
          brand: data.brand,
          model: data.model,
          spec: data.spec,
          currentBikeId: data.currentBikeId || null,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });
      
      logger.info(`Found ${components.length} components for bike ${bikeId}`);
      return components;
    } catch (error) {
      logger.error('Error getting components by bike ID:', error);
      throw error;
    }
  },

  /**
   * Get a specific component by ID
   */
  async getComponent(ownerUid: string, componentId: string): Promise<Component | null> {
    try {
      const componentRef = db.collection('components').doc(componentId);
      const doc = await componentRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      
      // Check if the component belongs to the user
      if (data.ownerUid !== ownerUid) {
        return null;
      }
      
      const component: Component = {
        id: doc.id,
        ownerUid: data.ownerUid,
        kind: data.kind,
        brand: data.brand,
        model: data.model,
        spec: data.spec,
        currentBikeId: data.currentBikeId || null,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
      
      return component;
    } catch (error) {
      logger.error('Error getting component:', error);
      throw error;
    }
  },

  /**
   * Create a new component
   */
  async createComponent(ownerUid: string, componentData: CreateComponentData): Promise<Component> {
    try {
      const now = new Date();
      const componentRef = db.collection('components').doc();
      
      const component: Omit<Component, 'id'> = {
        ownerUid,
        kind: componentData.kind,
        brand: componentData.brand,
        model: componentData.model,
        spec: componentData.spec,
        currentBikeId: componentData.currentBikeId || null,
        createdAt: now,
        updatedAt: now
      };
      
      await componentRef.set(component);
      
      const createdComponent: Component = {
        id: componentRef.id,
        ...component
      };
      
      logger.info(`Created component ${componentRef.id} for user ${ownerUid}`);
      return createdComponent;
    } catch (error) {
      logger.error('Error creating component:', error);
      throw error;
    }
  },

  /**
   * Update a component
   */
  async updateComponent(ownerUid: string, componentId: string, updates: Partial<CreateComponentData>): Promise<Component | null> {
    try {
      const componentRef = db.collection('components').doc(componentId);
      const doc = await componentRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      
      // Check if the component belongs to the user
      if (data.ownerUid !== ownerUid) {
        return null;
      }
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await componentRef.update(updateData);
      
      // Get the updated component
      const updatedDoc = await componentRef.get();
      const updatedData = updatedDoc.data()!;
      
      const component: Component = {
        id: componentId,
        ownerUid: updatedData.ownerUid,
        kind: updatedData.kind,
        brand: updatedData.brand,
        model: updatedData.model,
        spec: updatedData.spec,
        currentBikeId: updatedData.currentBikeId || null,
        createdAt: updatedData.createdAt.toDate(),
        updatedAt: updatedData.updatedAt.toDate()
      };
      
      logger.info(`Updated component ${componentId} for user ${ownerUid}`);
      return component;
    } catch (error) {
      logger.error('Error updating component:', error);
      throw error;
    }
  },

  /**
   * Delete a component
   */
  async deleteComponent(ownerUid: string, componentId: string): Promise<boolean> {
    try {
      const componentRef = db.collection('components').doc(componentId);
      const doc = await componentRef.get();
      
      if (!doc.exists) {
        return false;
      }
      
      const data = doc.data()!;
      
      // Check if the component belongs to the user
      if (data.ownerUid !== ownerUid) {
        return false;
      }
      
      await componentRef.delete();
      
      logger.info(`Deleted component ${componentId} for user ${ownerUid}`);
      return true;
    } catch (error) {
      logger.error('Error deleting component:', error);
      throw error;
    }
  },

  /**
   * Install a component on a bike
   */
  async installComponent(ownerUid: string, componentId: string, bikeId: string, installedOdometer: number): Promise<Component | null> {
    try {
      // Verify the component belongs to the user
      const component = await this.getComponent(ownerUid, componentId);
      if (!component) {
        return null;
      }
      
      // Verify the bike belongs to the user
      const bikeRef = db.collection('bikes').doc(bikeId);
      const bikeDoc = await bikeRef.get();
      if (!bikeDoc.exists) {
        return null;
      }
      
      const bikeData = bikeDoc.data()!;
      if (bikeData.ownerUid !== ownerUid) {
        return null;
      }
      
      const now = new Date();
      
      // Update the component to mark it as installed on this bike
      const componentRef = db.collection('components').doc(componentId);
      await componentRef.update({
        currentBikeId: bikeId,
        updatedAt: now
      });
      
      // Create an installation record
      const installationRef = componentRef.collection('installations').doc();
      await installationRef.set({
        bikeId,
        installedAt: now,
        installedOdometer
      });
      
      // Get the updated component
      const updatedComponent = await this.getComponent(ownerUid, componentId);
      
      logger.info(`Installed component ${componentId} on bike ${bikeId} for user ${ownerUid}`);
      return updatedComponent;
    } catch (error) {
      logger.error('Error installing component:', error);
      throw error;
    }
  },

  /**
   * Remove a component from a bike
   */
  async removeComponent(ownerUid: string, componentId: string, removedOdometer: number): Promise<Component | null> {
    try {
      // Verify the component belongs to the user
      const component = await this.getComponent(ownerUid, componentId);
      if (!component) {
        return null;
      }
      
      if (!component.currentBikeId) {
        throw new Error('Component is not currently installed on any bike');
      }
      
      const now = new Date();
      
      // Update the component to remove it from the bike
      const componentRef = db.collection('components').doc(componentId);
      await componentRef.update({
        currentBikeId: null,
        updatedAt: now
      });
      
      // Update the latest installation record to mark it as removed
      const installationsRef = componentRef.collection('installations');
      const installationsSnapshot = await installationsRef
        .where('bikeId', '==', component.currentBikeId)
        .orderBy('installedAt', 'desc')
        .limit(1)
        .get();
      
      if (!installationsSnapshot.empty) {
        const latestInstallation = installationsSnapshot.docs[0];
        if (latestInstallation) {
          await latestInstallation.ref.update({
            removedAt: now,
            removedOdometer
          });
        }
      }
      
      // Get the updated component
      const updatedComponent = await this.getComponent(ownerUid, componentId);
      
      logger.info(`Removed component ${componentId} from bike ${component.currentBikeId} for user ${ownerUid}`);
      return updatedComponent;
    } catch (error) {
      logger.error('Error removing component:', error);
      throw error;
    }
  }
};
