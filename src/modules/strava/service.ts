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
   * Get athlete activities from Strava (used for debugging endpoints)
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
   * Map Strava frame type to a friendly bike type
   */
  private mapFrameType(frameType?: number): string {
    switch (frameType) {
      case 1:
        return 'Time Trial';
      case 2:
        return 'Mountain';
      case 3:
        return 'Cross';
      case 4:
        return 'Track';
      default:
        return 'Road';
    }
  }

  /**
   * Generate a LogLynx unique identifier (mirrors bikes service)
   */
  private generateUniqueIdentifier(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomChar = () => chars[Math.floor(Math.random() * chars.length)];
    return `LYNX-${Array.from({ length: 4 }, randomChar).join('')}-${Array.from({ length: 4 }, randomChar).join('')}-${Array.from({ length: 4 }, randomChar).join('')}`;
  }

  /**
   * Fetch authenticated athlete profile
   */
  private async getAthleteProfile(accessToken: string): Promise<any> {
    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Strava athlete profile:', error);
      throw new Error(`Failed to fetch Strava athlete profile: ${error.message}`);
    }
  }

  /**
   * Fetch detailed gear information
   */
  private async getGearDetails(accessToken: string, gearId: string): Promise<any | null> {
    try {
      const response = await axios.get(`https://www.strava.com/api/v3/gear/${gearId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error: any) {
      logger.warn(`Unable to fetch gear ${gearId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Sync Strava bikes into LogLynx
   */
  async syncBikes(uid: string): Promise<{ imported: number; updated: number }> {
    try {
      const accessToken = await this.getValidAccessToken(uid);
      const connection = await this.getConnection(uid);

      if (!connection) {
        throw new Error('Strava connection not found');
      }

      const athlete = await this.getAthleteProfile(accessToken);
      const stravaBikes: any[] = Array.isArray(athlete?.bikes) ? athlete.bikes : [];

      if (stravaBikes.length === 0) {
        logger.info(`No Strava bikes found for user ${uid}`);
        return { imported: 0, updated: 0 };
      }

      const bikesRef = db.collection('bikes');
      let imported = 0;
      let updated = 0;

      for (const bike of stravaBikes) {
        const gearId = bike.id;
        const gearDetails = gearId ? await this.getGearDetails(accessToken, gearId) : null;

        const name = gearDetails?.name || bike.name || `Strava Bike ${gearId}`;
        const brand = gearDetails?.brand_name || '';
        const type = this.mapFrameType(gearDetails?.frame_type);
        const totalMileage = Math.round((gearDetails?.distance || bike.distance || 0) / 1000);
        const photoUrl = gearDetails?.photo_url || null;

        const existingQuery = await bikesRef
          .where('ownerUid', '==', uid)
          .where('stravaBikeId', '==', gearId)
          .limit(1)
          .get();

        if (existingQuery.empty) {
          const now = new Date();
          const newBikeRef = bikesRef.doc();
          await newBikeRef.set({
            ownerUid: uid,
            name,
            brand,
            type,
            year: now.getFullYear(),
            status: 'Good',
            totalMileage,
            tags: ['strava'],
            uniqueIdentifier: this.generateUniqueIdentifier(),
            stravaBikeId: gearId,
            photoUrl,
            createdAt: now,
            updatedAt: now
          });
          imported++;
          logger.info(`Imported new Strava bike ${gearId} (${name}) for user ${uid}`);
        } else {
          const doc = existingQuery.docs[0];
          await doc.ref.update({
            name,
            brand,
            type,
            totalMileage,
            photoUrl,
            updatedAt: new Date()
          });
          updated++;
          logger.info(`Updated existing Strava bike ${gearId} for user ${uid}`);
        }
      }

      await this.saveConnection(uid, {
        ...connection,
        lastSyncAt: Date.now()
      });

      logger.info(`Strava bike sync complete for user ${uid}: imported=${imported}, updated=${updated}`);
      return { imported, updated };
    } catch (error: any) {
      logger.error(`Error syncing Strava bikes for user ${uid}:`, error);
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

