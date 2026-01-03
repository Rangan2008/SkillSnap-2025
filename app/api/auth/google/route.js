import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/authServer';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/google
 * Authenticate with Google (Firebase token exchange)
 * ✅ Vercel Production-Safe
 */
export async function POST(request) {
  try {
    console.log('🔵 Google auth request received');
    
    const body = await request.json();
    const { firebaseToken } = body;

    if (!firebaseToken) {
      console.error('❌ No Firebase token provided');
      return createErrorResponse('Firebase token is required', 400);
    }

    console.log('🔵 Firebase token received, length:', firebaseToken.length);

    // Verify Firebase ID token
    let decodedToken;
    try {
      console.log('🔵 Verifying Firebase token...');
      decodedToken = await verifyFirebaseToken(firebaseToken);
      console.log('✅ Firebase token verified for:', decodedToken.email);
      console.log('Token details:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        provider: decodedToken.firebase?.sign_in_provider
      });
    } catch (error) {
      console.error('❌ Firebase token verification failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
      
      // Provide specific error messages
      if (error.code === 'auth/id-token-expired') {
        return createErrorResponse('Firebase token has expired. Please sign in again.', 401);
      }
      if (error.code === 'auth/invalid-id-token') {
        return createErrorResponse('Invalid Firebase token format. Please sign in again.', 401);
      }
      if (error.code === 'auth/argument-error') {
        return createErrorResponse('Firebase token is malformed. Please sign in again.', 401);
      }
      
      return createErrorResponse('Invalid Firebase token. Please try logging in again.', 401);
    }

    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      console.error('❌ No email in Firebase token');
      return createErrorResponse('Email not found in Firebase token', 400);
    }

    // Connect to database
    console.log('🔵 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('📝 Creating new user for:', email);
      // Create new user from Google account
      user = await User.create({
        email: email.toLowerCase(),
        fullName: name || email.split('@')[0],
        firebaseUid: uid,
        profilePicture: picture,
        // No password for Google users
      });
      console.log('✅ New user created:', user._id);
    } else {
      console.log('✅ Existing user found:', user._id);
      // Update existing user's Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
        console.log('✅ Updated user Firebase UID');
      }
      // Update profile picture if changed
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        await user.save();
        console.log('✅ Updated user profile picture');
      }
    }

    // Generate backend JWT token
    console.log('🔵 Generating JWT token...');
    const token = generateToken(user._id);
    console.log('✅ JWT token generated for user:', user._id);

    return createSuccessResponse(
      {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        },
        token
      },
      'Google login successful'
    );

  } catch (error) {
    console.error('❌ Google login error:', error);
    console.error('Error stack:', error.stack);
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
