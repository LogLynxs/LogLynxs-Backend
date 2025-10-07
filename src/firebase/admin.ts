import * as admin from 'firebase-admin';
import { logger } from '../core/logger';

let firebaseApp: admin.app.App | undefined;

export const initializeFirebase = (): admin.app.App => {
  if (!firebaseApp) {
    try {
      // Check if we have service account credentials
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID!
        });
      } else {
        // For development, you can use a service account key file
        const serviceAccount = require('../../loglynx-6691a-firebase-adminsdk-fbsvc-d125771b71.json');
        
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: 'loglynx-6691a' // Explicitly set the correct project ID
        });
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
