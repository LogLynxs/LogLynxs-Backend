import * as admin from 'firebase-admin';
import fs from 'fs';
import { logger } from '../core/logger';

let firebaseApp: admin.app.App | undefined;

export const initializeFirebase = (): admin.app.App => {
  if (!firebaseApp) {
    try {
      const projectId: string | undefined = process.env.FIREBASE_PROJECT_ID || undefined;

      // Preferred: service account JSON provided via env var
      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (saJson) {
        try {
          const parsed = JSON.parse(saJson) as admin.ServiceAccount;
          const options: admin.AppOptions = {
            credential: admin.credential.cert(parsed),
            ...(projectId ? { projectId } : {})
          } as admin.AppOptions;
          firebaseApp = admin.initializeApp(options);
          return firebaseApp;
        } catch (error) {
          logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error);
          // Fall through to try other methods
        }
      }

      // Try base64-encoded JSON in GOOGLE_APPLICATION_CREDENTIALS (most reliable for Railway)
      const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (gac) {
        try {
          // Try base64 decode first (Railway-friendly)
          const decoded = Buffer.from(gac, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded) as admin.ServiceAccount;
          const options: admin.AppOptions = {
            credential: admin.credential.cert(parsed),
            ...(projectId ? { projectId } : {})
          } as admin.AppOptions;
          firebaseApp = admin.initializeApp(options);
          return firebaseApp;
        } catch (error) {
          logger.error('Failed to parse base64-encoded GOOGLE_APPLICATION_CREDENTIALS:', error);
          // Fall through to try other methods
        }
      }

      // As a last resort, use application default credentials (only works on GCP)
      {
        const options: admin.AppOptions = {
          credential: admin.credential.applicationDefault(),
          ...(projectId ? { projectId } : {})
        } as admin.AppOptions;
        firebaseApp = admin.initializeApp(options);
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  return firebaseApp;
};

export const getFirestore = (): admin.firestore.Firestore => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  
  return admin.firestore();
};

export const getAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

export const db = getFirestore();

export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Failed to verify Firebase token:', error);
    throw new Error('Invalid Firebase ID token');
  }
};

export default firebaseApp!;
