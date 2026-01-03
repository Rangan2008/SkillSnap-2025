import { getUserFromRequest } from '@/lib/authServer';
import { handleError, createSuccessResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for JWT verification)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
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
