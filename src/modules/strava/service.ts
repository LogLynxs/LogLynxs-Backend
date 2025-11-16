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
      logger.info(`Strava service initialized with Client ID: ${this.clientId.substring(0, 4)}...`);
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
   * Sync activities from Strava to Firestore
   */
  async syncActivities(uid: string): Promise<{ synced: number; skipped: number }> {
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

      const batch = db.batch();
      const activitiesRef = db.collection('activities');

      for (const activity of activities) {
        // Only sync rides
        if (activity.type !== 'Ride') {
          skipped++;
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

        // Create activity document
        const activityRef = activitiesRef.doc();
        batch.set(activityRef, {
          userUid: uid,
          source: 'strava',
          stravaId: activity.id.toString(),
          startedAt: new Date(activity.start_date),
          distanceKm: activity.distance / 1000, // Convert meters to km
          movingTimeSec: activity.moving_time,
          elapsedTimeSec: activity.elapsed_time,
          elevationGainM: activity.total_elevation_gain,
          averageSpeedMps: activity.average_speed,
          maxSpeedMps: activity.max_speed,
          averageCadence: activity.average_cadence || null,
          averageWatts: activity.average_watts || null,
          kilojoules: activity.kilojoules || null,
          calories: activity.calories || null,
          bikeId: activity.bike_id ? activity.bike_id.toString() : null,
          gearId: activity.gear_id || null,
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

      logger.info(`Synced ${synced} activities for user ${uid}, skipped ${skipped}`);
      return { synced, skipped };
    } catch (error: any) {
      logger.error(`Error syncing activities for user ${uid}:`, error);
      throw error;
    }
  }
}

export const stravaService = new StravaService();

