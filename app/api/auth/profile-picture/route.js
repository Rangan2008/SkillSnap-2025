import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/authServer';
import { uploadProfilePicture } from '@/lib/cloudinary';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/profile-picture
 * Upload profile picture
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);

    // Get form data
    const formData = await request.formData();
    const file = formData.get('profilePicture');

    if (!file) {
      return createErrorResponse('No image file provided', 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return createErrorResponse('Only image files are allowed', 400);
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return createErrorResponse('File size must be less than 5MB', 400);
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadProfilePicture(buffer, user._id);

    // Connect to database and update user's profile picture URL
    await connectDB();
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { profilePicture: uploadResult.url },
      { new: true }
    );

    return createSuccessResponse(
      {
        profilePicture: uploadResult.url,
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          profilePicture: updatedUser.profilePicture
        }
      },
      'Profile picture uploaded successfully'
    );

  } catch (error) {
    console.error('Profile picture upload error:', error);
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
