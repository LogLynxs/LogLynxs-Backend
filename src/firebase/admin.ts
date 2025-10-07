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
        const parsed = JSON.parse(saJson) as admin.ServiceAccount;
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(parsed),
          projectId
        });
        return firebaseApp;
      }

      // Support base64-encoded JSON in GOOGLE_APPLICATION_CREDENTIALS
      const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (gac) {
        try {
          // Try parse as JSON string first
          const parsed = JSON.parse(gac) as admin.ServiceAccount;
          firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(parsed),
            projectId
          });
          return firebaseApp;
        } catch (_) {
          // If not JSON, try base64 decode -> JSON
          try {
            const decoded = Buffer.from(gac, 'base64').toString('utf8');
            const parsed = JSON.parse(decoded) as admin.ServiceAccount;
            firebaseApp = admin.initializeApp({
              credential: admin.credential.cert(parsed),
              projectId
            });
            return firebaseApp;
          } catch (_) {
            // If env value is a file path, try reading it
            try {
              if (fs.existsSync(gac)) {
                const file = fs.readFileSync(gac, 'utf8');
                const parsed = JSON.parse(file) as admin.ServiceAccount;
                firebaseApp = admin.initializeApp({
                  credential: admin.credential.cert(parsed),
                  projectId
                });
                return firebaseApp;
              }
            } catch (e) {
              logger.error('Failed to read GOOGLE_APPLICATION_CREDENTIALS file:', e);
            }
            // Fall through to application default
          }
        }
      }

      // As a last resort, use application default credentials (only works on GCP)
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId
      });
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
