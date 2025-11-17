import * as admin from 'firebase-admin';
import { db } from '../../firebase/admin';
import { logger } from '../../core/logger';

const tokensCollection = db.collection('notification_tokens');

export const notificationService = {
  async saveDeviceToken(uid: string, token: string, platform: string = 'android'): Promise<void> {
    try {
      await tokensCollection.doc(token).set(
        {
          uid,
          platform,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastSeenAt: Date.now()
        },
        { merge: true }
      );
      logger.info(`Saved notification token for user ${uid}`);
    } catch (error) {
      logger.error('Error saving notification token:', error);
      throw error;
    }
  },

  async removeDeviceToken(uid: string, token: string): Promise<void> {
    try {
      const doc = await tokensCollection.doc(token).get();
      if (doc.exists && doc.data()?.uid !== uid) {
        logger.warn(`Token ${token} does not belong to user ${uid}`);
        return;
      }
      await tokensCollection.doc(token).delete();
      logger.info(`Removed notification token for user ${uid}`);
    } catch (error) {
      logger.error('Error removing notification token:', error);
      throw error;
    }
  },

  async sendNotification(
    uid: string,
    payload: { title: string; body: string; data?: Record<string, string> }
  ): Promise<void> {
    try {
      const snapshot = await tokensCollection.where('uid', '==', uid).get();
      if (snapshot.empty) {
        logger.info(`No notification tokens registered for user ${uid}`);
        return;
      }

      const tokens = snapshot.docs.map(doc => doc.id);
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          const errorCode = resp.error?.code || '';
          if (errorCode.includes('not-registered') || errorCode.includes('invalid-registration-token')) {
            tokensCollection.doc(tokens[index]).delete().catch(err => {
              logger.error(`Failed to delete invalid token ${tokens[index]}:`, err);
            });
          }
        }
      });

      logger.info(`Notification sent to ${uid}: ${payload.title}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }
};

