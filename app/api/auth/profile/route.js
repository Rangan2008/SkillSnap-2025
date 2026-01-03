import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/authServer';
import { handleError, createSuccessResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/profile
 * Get current user profile
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);

    return createSuccessResponse({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        jobPreferences: user.jobPreferences,
        currentCourse: user.currentCourse,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * PUT /api/auth/profile
 * Update user profile
 */
export async function PUT(request) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    const body = await request.json();
    const { fullName, jobPreferences, currentCourse } = body;
    
    // Build update data
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (jobPreferences) updateData.jobPreferences = jobPreferences;
    if (currentCourse) updateData.currentCourse = currentCourse;

    // Connect to database
    await connectDB();

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    );

    return createSuccessResponse(
      { user: updatedUser },
      'Profile updated successfully'
    );
    
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
