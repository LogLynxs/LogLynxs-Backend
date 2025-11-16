import { getFirestore } from '../../firebase/admin';
import { logger } from '../../core/logger';
import { CustomError } from '../../core/errorHandler';

export interface UserProfile {
  email: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date;
  prefs: {
    darkMode: 'system' | 'light' | 'dark';
    notificationsEnabled: boolean;
    biometricsEnabled: boolean;
    stravaAutoSync?: boolean;
  };
}

export interface CreateUserProfileData {
  email: string;
  displayName: string;
}

export const userService = {
  /**
   * Create or update user profile in Firestore
   */
  createOrUpdateProfile: async (uid: string, userData: CreateUserProfileData): Promise<UserProfile> => {
    try {
      logger.info(`Creating/updating user profile for UID: ${uid}`);
      
      const db = getFirestore();
      const userRef = db.collection('users').doc(uid);
      
      const now = new Date();
      
      const userProfile: UserProfile = {
        email: userData.email,
        displayName: userData.displayName,
        createdAt: now,
        lastLoginAt: now,
        prefs: {
          darkMode: 'system',
          notificationsEnabled: true,
          biometricsEnabled: false,
          stravaAutoSync: false
        }
      };
      
      // Use merge: true to update existing profile or create new one
      await userRef.set(userProfile, { merge: true });
      
      logger.info(`✅ User profile created/updated successfully for UID: ${uid}`);
      return userProfile;
    } catch (error) {
      logger.error(`❌ Failed to create/update user profile for UID ${uid}:`, error);
      throw new CustomError('Failed to create user profile', 500, 'PROFILE_CREATION_FAILED');
    }
  },

  /**
   * Get user profile from Firestore
   */
  getProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      logger.info(`Getting user profile for UID: ${uid}`);
      
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        logger.info(`📭 User profile not found for UID: ${uid}`);
        return null;
      }
      
      const userData = userDoc.data() as UserProfile;
      logger.info(`✅ User profile retrieved for UID: ${uid}`);
      return userData;
    } catch (error) {
      logger.error(`❌ Failed to get user profile for UID ${uid}:`, error);
      throw new CustomError('Failed to get user profile', 500, 'PROFILE_RETRIEVAL_FAILED');
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (uid: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      logger.info(`Updating user profile for UID: ${uid}`);
      
      const db = getFirestore();
      const userRef = db.collection('users').doc(uid);
      
      // Add updatedAt timestamp
      const updateData = {
        ...updates,
        lastLoginAt: new Date()
      };
      
      await userRef.update(updateData);
      
      // Get the updated profile
      const updatedProfile = await userService.getProfile(uid);
      if (!updatedProfile) {
        throw new CustomError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      
      logger.info(`✅ User profile updated successfully for UID: ${uid}`);
      return updatedProfile;
    } catch (error) {
      logger.error(`❌ Failed to update user profile for UID ${uid}:`, error);
      throw new CustomError('Failed to update user profile', 500, 'PROFILE_UPDATE_FAILED');
    }
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (uid: string, prefs: Partial<UserProfile['prefs']>): Promise<UserProfile> => {
    try {
      logger.info(`⚙️ Updating user preferences for UID: ${uid}`);
      
      const db = getFirestore();
      const userRef = db.collection('users').doc(uid);
      
      // Get current profile to merge preferences
      const currentProfile = await userService.getProfile(uid);
      if (!currentProfile) {
        throw new CustomError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      
      // Merge existing preferences with new ones
      const updatedPrefs = {
        ...currentProfile.prefs,
        ...prefs
      };
      
      await userRef.update({
        'prefs': updatedPrefs,
        lastLoginAt: new Date()
      });
      
      // Get the updated profile
      const updatedProfile = await userService.getProfile(uid);
      if (!updatedProfile) {
        throw new CustomError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      
      logger.info(`✅ User preferences updated successfully for UID: ${uid}`);
      return updatedProfile;
    } catch (error) {
      logger.error(`❌ Failed to update user preferences for UID ${uid}:`, error);
      throw new CustomError('Failed to update user preferences', 500, 'PREFERENCES_UPDATE_FAILED');
    }
  },

  /**
   * Delete user profile
   */
  deleteProfile: async (uid: string): Promise<void> => {
    try {
      logger.info(`🗑️ Deleting user profile for UID: ${uid}`);
      
      const db = getFirestore();
      await db.collection('users').doc(uid).delete();
      
      logger.info(`✅ User profile deleted successfully for UID: ${uid}`);
    } catch (error) {
      logger.error(`❌ Failed to delete user profile for UID ${uid}:`, error);
      throw new CustomError('Failed to delete user profile', 500, 'PROFILE_DELETION_FAILED');
    }
  }
};
