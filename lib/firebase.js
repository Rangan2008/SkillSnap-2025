/**
 * Firebase Client-Side Configuration
 * ✅ Vercel Production-Safe Setup
 * 
 * CRITICAL for production:
 * 1. All env vars must use NEXT_PUBLIC_ prefix
 * 2. Auth persistence must be set to browserLocalPersistence
 * 3. Your Vercel domain must be added to Firebase Console > Authorized domains
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
if (typeof window !== 'undefined') {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    console.error('❌ Missing Firebase config:', missingKeys);
    console.error('Make sure these env vars are set in Vercel:');
    missingKeys.forEach(key => {
      const envVar = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      console.error(`  - ${envVar}`);
    });
  } else {
    console.log('✅ Firebase config loaded:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
  }
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth = getAuth(app);

// ✅ CRITICAL: Set auth persistence for production
// This ensures users stay logged in across page refreshes
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Firebase auth persistence set to browserLocalPersistence');
    })
    .catch((error) => {
      console.error('❌ Failed to set auth persistence:', error);
    });
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for optimal UX
// ✅ NO 'prompt' parameter = uses browser's active Google account automatically
// This provides the best user experience:
// - Single logged-in account → auto-selects it (no prompt)
// - Multiple accounts → shows account chooser
// - No logged-in account → shows Google login
googleProvider.setCustomParameters({
  // Uncomment below if you want to FORCE account selection every time:
  // prompt: 'select_account',
  
  // Uncomment below if you want to restrict to a specific domain:
  // hd: 'yourdomain.com',
});

// Add required OAuth scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Check if Firebase is properly configured
 * Useful for debugging production issues
 */
export const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
};

/**
 * Get current environment info (for debugging)
 */
export const getFirebaseEnvInfo = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    isDevelopment: window.location.hostname === 'localhost',
    isProduction: window.location.hostname.includes('vercel.app') || window.location.hostname.includes('.com'),
    hostname: window.location.hostname,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  };
};
