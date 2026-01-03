#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Helper
 * Run this to generate the command for setting up env vars on Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 VERCEL DEPLOYMENT SETUP HELPER\n');
console.log('=' .repeat(60));

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('\n❌ ERROR: .env.local file not found!');
  console.log('\n📝 Steps to fix:');
  console.log('   1. Copy .env.local.example to .env.local');
  console.log('   2. Fill in all the values');
  console.log('   3. Run this script again\n');
  process.exit(1);
}

console.log('\n✅ Found .env.local file');
console.log('\n📋 STEPS TO DEPLOY TO VERCEL:\n');

console.log('1️⃣  Install Vercel CLI (if not already installed):');
console.log('   npm i -g vercel\n');

console.log('2️⃣  Login to Vercel:');
console.log('   vercel login\n');

console.log('3️⃣  Link your project:');
console.log('   vercel link\n');

console.log('4️⃣  Add environment variables:');
console.log('   vercel env pull .env.vercel.local\n');

console.log('5️⃣  IMPORTANT: Add Firebase Admin credentials manually:');
console.log('   Go to: https://vercel.com/dashboard');
console.log('   → Your Project → Settings → Environment Variables\n');
console.log('   Add these 3 variables:\n');
console.log('   FIREBASE_ADMIN_PROJECT_ID=skill-snap');
console.log('   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@skill-snap.iam.gserviceaccount.com');
console.log('   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"\n');

console.log('6️⃣  Configure Firebase:');
console.log('   a) Add your Vercel domain to Firebase Authorized Domains');
console.log('      → Firebase Console → Authentication → Settings → Authorized domains');
console.log('      → Add: your-app.vercel.app\n');
console.log('   b) Verify auth domain in environment variables:');
console.log('      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=skill-snap.firebaseapp.com\n');

console.log('7️⃣  Deploy:');
console.log('   vercel --prod\n');

console.log('=' .repeat(60));
console.log('\n⚠️  CRITICAL CHECKLIST BEFORE DEPLOYING:\n');

const checklist = [
  'MongoDB URI is set and IP whitelist includes 0.0.0.0/0',
  'All NEXT_PUBLIC_FIREBASE_* variables are set',
  'FIREBASE_ADMIN_* credentials are configured on Vercel',
  'Firebase auth domain is .firebaseapp.com (NOT .web.app)',
  'Vercel domain added to Firebase authorized domains',
  'Google OAuth redirect URIs include Firebase and Vercel domains',
  'JWT_SECRET is a strong random string',
  'Cloudinary credentials are valid',
  'Gemini API key has quota remaining'
];

checklist.forEach((item, i) => {
  console.log(`   ${i + 1}. [ ] ${item}`);
});

console.log('\n📚 For detailed instructions, see: VERCEL_DEPLOYMENT.md\n');
console.log('🆘 Having issues? Check Vercel function logs for specific errors.\n');
