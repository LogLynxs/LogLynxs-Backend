const admin = require('firebase-admin');
const serviceAccount = require('../loglynx-6691a-firebase-adminsdk-fbsvc-d125771b71.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'loglynx-6691a'
});

const db = admin.firestore();

async function cleanupExpiredTokens() {
  try {
    const now = new Date();
    const snapshot = await db.collection('refresh_tokens').get();
    
    let deletedCount = 0;
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      const tokenData = doc.data();
      
      // Check for expired tokens
      if (tokenData.expiresAt && tokenData.expiresAt.toDate() < now) {
        batch.delete(doc.ref);
        deletedCount++;
      }
      // Check for inactive tokens (soft deleted)
      else if (tokenData.isActive === false) {
        batch.delete(doc.ref);
        deletedCount++;
      }
      // Check for tokens that haven't been used in 30 days
      else if (tokenData.lastUsed && tokenData.lastUsed.toDate() < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Deleted ${deletedCount} expired/inactive refresh tokens`);
    } else {
      console.log('No expired tokens found');
    }
    
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  } finally {
    process.exit(0);
  }
}

cleanupExpiredTokens();
