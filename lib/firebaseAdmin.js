import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize Firebase Admin SDK (singleton pattern for serverless)
 */
let firebaseAdmin = null;

export const initializeFirebaseAdmin = () => {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  if (!admin.apps.length) {
    try {
      // Use environment variables (preferred for Vercel deployment)
      if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
          })
        });
        
        console.log('✅ Firebase Admin SDK initialized with environment variables');
      } else {
        // Fallback to service account file (for local development)
        const serviceAccountPath = path.join(process.cwd(), 'config', 'serviceAccountKey.json');
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath)
        });
        
        console.log('✅ Firebase Admin SDK initialized with service account file');
      }
    } catch (error) {
      console.error('❌ Firebase admin initialization error:', error.message);
      console.error('Make sure Firebase Admin env vars are set or serviceAccountKey.json exists');
    }
  }

  firebaseAdmin = admin;
  return firebaseAdmin;
};

/**
 * Verify Firebase ID token
 * @param {string} token - Firebase ID token
 * @returns {Promise<Object>} Decoded token
 */
export const verifyFirebaseToken = async (token) => {
  const admin = initializeFirebaseAdmin();
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    throw new Error('Invalid Firebase token');
  }
};

export default initializeFirebaseAdmin;
