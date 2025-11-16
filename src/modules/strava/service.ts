import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../../core/logger';
import axios from 'axios';

const db = getFirestore();

export interface StravaConnection {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  athleteId: string;
  athleteName?: string;
  lastSyncAt?: number;
  createdAt: number;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string; // Ride, Run, etc.
  start_date: string; // ISO 8601
  start_date_local: string;
  timezone: string;
  gear_id?: string;
  bike_id?: number;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_cadence?: number;
  average_watts?: number;
  kilojoules?: number;
  calories?: number;
}

class StravaService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID || '';
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET || '';
    this.redirectUri = process.env.STRAVA_REDIRECT_URI || '';
    
    // Validate configuration
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      logger.warn('Strava configuration incomplete. Please set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REDIRECT_URI in your environment variables.');
    } else {
      logger.info(`Strava service initialized with Client ID: ${this.clientId.substring(0, 4)}..., Client Secret: ${this.clientSecret.substring(0, 4)}...`);
    }
  }

  /**
   * Get authorization URL for Strava OAuth
   */
  getAuthorizationUrl(state: string): string {
    if (!this.clientId || !this.redirectUri) {
      throw new Error('Strava Client ID or Redirect URI not configured. Please set STRAVA_CLIENT_ID and STRAVA_REDIRECT_URI environment variables.');
    }
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'activity:read_all,profile:read_all',
      state: state,
      approval_prompt: 'force'
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: {
      id: number;
      username?: string;
      firstname: string;
      lastname: string;
    };
  }> {
    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code'
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error exchanging Strava code for token:', error);
      throw new Error(`Failed to exchange Strava code: ${error.message}`);
    }
  }

  /**
   * Refresh Strava access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }> {
    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error refreshing Strava token:', error);
      throw new Error(`Failed to refresh Strava token: ${error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(uid: string): Promise<string> {
    const connection = await this.getConnection(uid);
    if (!connection) {
      throw new Error('Strava account not connected');
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    if (connection.expiresAt > now + 300) {
      return connection.accessToken;
    }

    // Token expired, refresh it
    logger.info(`Refreshing Strava token for user ${uid}`);
    const refreshed = await this.refreshAccessToken(connection.refreshToken);

    const updatedConnection: StravaConnection = {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at,
      athleteId: connection.athleteId,
      createdAt: connection.createdAt
    };

    // Only include optional properties if they're defined
    if (connection.athleteName !== undefined) {
      updatedConnection.athleteName = connection.athleteName;
    }
    if (connection.lastSyncAt !== undefined) {
      updatedConnection.lastSyncAt = connection.lastSyncAt;
    }

    await this.saveConnection(uid, updatedConnection);

    return refreshed.access_token;
  }

  /**
   * Save Strava connection to Firestore
   */
  async saveConnection(uid: string, connection: StravaConnection): Promise<void> {
    const docRef = db.collection('strava-connections').doc(uid);
    await docRef.set({
      ...connection,
      updatedAt: Date.now()
    });
    logger.info(`Saved Strava connection for user ${uid}`);
  }

  /**
   * Get Strava connection from Firestore
   */
  async getConnection(uid: string): Promise<StravaConnection | null> {
    const docRef = db.collection('strava-connections').doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      accessToken: data?.accessToken || '',
      refreshToken: data?.refreshToken || '',
      expiresAt: data?.expiresAt || 0,
      athleteId: data?.athleteId || '',
      athleteName: data?.athleteName,
      lastSyncAt: data?.lastSyncAt,
      createdAt: data?.createdAt || Date.now()
    };
  }

  /**
   * Delete Strava connection
   */
  async deleteConnection(uid: string): Promise<void> {
    const docRef = db.collection('strava-connections').doc(uid);
    await docRef.delete();
    logger.info(`Deleted Strava connection for user ${uid}`);
  }

  /**
   * Get athlete activities from Strava
   */
  async getActivities(accessToken: string, options?: {
    before?: number;
    after?: number;
    perPage?: number;
    page?: number;
  }): Promise<StravaActivity[]> {
    try {
      const params = new URLSearchParams();
      if (options?.before) params.append('before', options.before.toString());
      if (options?.after) params.append('after', options.after.toString());
      if (options?.perPage) params.append('per_page', options.perPage.toString());
      if (options?.page) params.append('page', options.page.toString());

      const url = `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Strava activities:', error);
      throw new Error(`Failed to fetch Strava activities: ${error.message}`);
    }
  }

  /**
   * Get or create a LogLynx bike from a Strava bike ID
   * Returns the LogLynx bike ID
   */
  async getOrCreateStravaBike(uid: string, stravaBikeId: string, bikeName?: string): Promise<string | null> {
    try {
      const bikesRef = db.collection('bikes');
      
      // Check if bike already exists (mapped from Strava)
      const existingBikeQuery = await bikesRef
        .where('ownerUid', '==', uid)
        .where('stravaBikeId', '==', stravaBikeId)
        .limit(1)
        .get();
      
      if (!existingBikeQuery.empty) {
        const existingBikeDoc = existingBikeQuery.docs[0];
        if (existingBikeDoc) {
          logger.info(`Found existing LogLynx bike ${existingBikeDoc.id} for Strava bike ${stravaBikeId}`);
          return existingBikeDoc.id;
        }
      }
      
      // Create new bike from Strava
      const bikeData = {
        ownerUid: uid,
        name: bikeName || `Strava Bike ${stravaBikeId}`,
        brand: '', // Strava doesn't always provide this in activity data
        type: 'Road', // Default, user can update later
        year: new Date().getFullYear(), // Default, user can update later
        status: 'Good',
        totalMileage: 0,
        tags: ['strava'],
        stravaBikeId: stravaBikeId, // Store the Strava bike ID for mapping
        uniqueIdentifier: '', // Will be generated by bikeService if needed
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newBikeRef = bikesRef.doc();
      await newBikeRef.set(bikeData);
      
      logger.info(`Created new LogLynx bike ${newBikeRef.id} from Strava bike ${stravaBikeId}`);
      return newBikeRef.id;
    } catch (error: any) {
      logger.error(`Error getting/creating Strava bike: ${error.message}`);
      return null;
    }
  }

  /**
   * Sync activities from Strava to Firestore
   */
  async syncActivities(uid: string): Promise<{ synced: number; skipped: number; mileageUpdated: number; bikesCreated: number }> {
    try {
      const accessToken = await this.getValidAccessToken(uid);
      const connection = await this.getConnection(uid);
      
      if (!connection) {
        throw new Error('Strava connection not found');
      }

      // Get activities from last sync time, or last 30 days if first sync
      const after = connection.lastSyncAt 
        ? Math.floor(connection.lastSyncAt / 1000)
        : Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

      const activities = await this.getActivities(accessToken, {
        after: after,
        perPage: 200
      });

      let synced = 0;
      let skipped = 0;
      let mileageUpdated = 0;
      let bikesCreated = 0;

      const batch = db.batch();
      const activitiesRef = db.collection('activities');
      const bikesRef = db.collection('bikes');
      
      logger.info(`Found ${activities.length} activities from Strava API`);
      
      // Log activity types for debugging
      const activityTypes = activities.map(a => a.type);
      const typeCounts = activityTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      logger.info(`Activity types found: ${JSON.stringify(typeCounts)}`);

      // Step 1: Collect unique Strava bike IDs from activities
      const uniqueStravaBikeIds = new Set<string>();
      for (const activity of activities) {
        if (activity.type === 'Ride' && activity.bike_id) {
          uniqueStravaBikeIds.add(activity.bike_id.toString());
        }
      }
      
      logger.info(`Found ${uniqueStravaBikeIds.size} unique Strava bikes in activities`);
      
      // Step 2: Get or create LogLynx bikes for each Strava bike
      const stravaBikeToLoglynxBike = new Map<string, string>();
      const bikesRefForCheck = db.collection('bikes');
      
      for (const stravaBikeId of uniqueStravaBikeIds) {
        // Check if bike already exists
        const existingBikeQuery = await bikesRefForCheck
          .where('ownerUid', '==', uid)
          .where('stravaBikeId', '==', stravaBikeId)
          .limit(1)
          .get();
        
        const isNewBike = existingBikeQuery.empty;
        
        // Try to extract bike name from activities (if available in raw data)
        // For now, we'll use a generic name and user can update it later
        const loglynxBikeId = await this.getOrCreateStravaBike(uid, stravaBikeId);
        if (loglynxBikeId) {
          stravaBikeToLoglynxBike.set(stravaBikeId, loglynxBikeId);
          if (isNewBike) {
            bikesCreated++;
          }
        }
      }
      
      logger.info(`Mapped ${stravaBikeToLoglynxBike.size} Strava bikes to LogLynx bikes`);

      for (const activity of activities) {
        // Only sync rides
        if (activity.type !== 'Ride') {
          skipped++;
          logger.debug(`Skipping activity ${activity.id} - type: ${activity.type} (only 'Ride' activities are synced)`);
          continue;
        }

        // Check if activity already exists
        const existingQuery = await activitiesRef
          .where('userUid', '==', uid)
          .where('source', '==', 'strava')
          .where('stravaId', '==', activity.id.toString())
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          skipped++;
          continue;
        }

        // Match Strava bike to LogLynx bike using our mapping
        let matchedBikeId: string | null = null;
        const distanceKm = activity.distance / 1000; // Convert meters to km
        
        if (activity.bike_id) {
          const stravaBikeId = activity.bike_id.toString();
          matchedBikeId = stravaBikeToLoglynxBike.get(stravaBikeId) || null;
          
          if (matchedBikeId) {
            logger.debug(`Matched Strava bike ${stravaBikeId} to LogLynx bike ${matchedBikeId}`);
          } else {
            logger.warn(`Could not find LogLynx bike for Strava bike ${stravaBikeId}`);
          }
        }

        // If we matched a bike, check if we can update mileage
        let mileageAdded = false;
        if (matchedBikeId) {
          try {
            const bikeRef = bikesRef.doc(matchedBikeId);
            const bikeDoc = await bikeRef.get();
            
            if (bikeDoc.exists) {
              const bikeData = bikeDoc.data()!;
              // Check bike belongs to user
              if (bikeData.ownerUid === uid) {
                const currentMileage = bikeData.totalMileage || 0;
                const newMileage = currentMileage + Math.round(distanceKm);
                
                batch.update(bikeRef, {
                  totalMileage: newMileage,
                  updatedAt: new Date()
                });
                
                mileageAdded = true;
                mileageUpdated++;
                logger.info(`Auto-added ${distanceKm.toFixed(2)} km to bike ${matchedBikeId} (${bikeData.name})`);
              }
            }
          } catch (error: any) {
            logger.error(`Error updating bike mileage for activity ${activity.id}: ${error.message}`);
            // Don't fail the whole sync if mileage update fails
          }
        }

        // Create activity document
        const activityRef = activitiesRef.doc();
        batch.set(activityRef, {
          userUid: uid,
          source: 'strava',
          stravaId: activity.id.toString(),
          startedAt: new Date(activity.start_date),
          distanceKm: distanceKm,
          movingTimeSec: activity.moving_time,
          elapsedTimeSec: activity.elapsed_time,
          elevationGainM: activity.total_elevation_gain,
          averageSpeedMps: activity.average_speed,
          maxSpeedMps: activity.max_speed,
          averageCadence: activity.average_cadence || null,
          averageWatts: activity.average_watts || null,
          kilojoules: activity.kilojoules || null,
          calories: activity.calories || null,
          stravaBikeId: activity.bike_id ? activity.bike_id.toString() : null,
          gearId: activity.gear_id || null,
          loglynxBikeId: matchedBikeId, // Our bike ID if matched
          mileageAdded: mileageAdded, // Track if mileage was added to bike
          raw: activity,
          createdAt: new Date()
        });

        synced++;
      }

      await batch.commit();

      // Update last sync time
      await this.saveConnection(uid, {
        ...connection,
        lastSyncAt: Date.now()
      });

      logger.info(`Synced ${synced} activities for user ${uid}, skipped ${skipped}, mileage updated for ${mileageUpdated} bikes, created ${bikesCreated} new bikes`);
      return { synced, skipped, mileageUpdated, bikesCreated };
    } catch (error: any) {
      logger.error(`Error syncing activities for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Get all synced activities for a user
   */
  async getSyncedActivities(uid: string, limit: number = 100): Promise<any[]> {
    try {
      const activitiesRef = db.collection('activities');
      const snapshot = await activitiesRef
        .where('userUid', '==', uid)
        .where('source', '==', 'strava')
        .orderBy('startedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for JSON serialization
        const result: any = {
          id: doc.id,
          ...data
        };
        
        // Convert Timestamps
        if (data.startedAt && data.startedAt.toDate) {
          result.startedAt = data.startedAt.toDate().toISOString();
        }
        if (data.createdAt && data.createdAt.toDate) {
          result.createdAt = data.createdAt.toDate().toISOString();
        }
        
        return result;
      });
    } catch (error: any) {
      logger.error(`Error getting synced activities for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Get raw activities from Strava API (without syncing)
   * Useful for debugging and seeing what data is available
   */
  async getRawActivities(uid: string, limit: number = 10): Promise<any[]> {
    try {
      const accessToken = await this.getValidAccessToken(uid);
      
      // Get activities from last 30 days
      const after = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      
      const activities = await this.getActivities(accessToken, {
        after: after,
        perPage: limit
      });

      return activities;
    } catch (error: any) {
      logger.error(`Error getting raw Strava activities for user ${uid}:`, error);
      throw error;
    }
  }
}

export const stravaService = new StravaService();

