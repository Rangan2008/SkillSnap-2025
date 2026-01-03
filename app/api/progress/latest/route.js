import connectDB from '@/lib/db';
import ProgressTracking from '@/lib/models/ProgressTracking';
import { getUserFromRequest } from '@/lib/authServer';
import { handleError, createSuccessResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/progress/latest
 * Get user's most recent progress entry
 */
export async function GET(request) {
    try {
        // Get authenticated user
        const user = await getUserFromRequest(request);

        // Connect to database
        await connectDB();

        // Get latest progress
        const latestProgress = await ProgressTracking.getLatestForUser(user._id);

        if (!latestProgress) {
            return createSuccessResponse({
                progress: null
            });
        }

        return createSuccessResponse({
            progress: {
                progressId: latestProgress._id.toString(),
                analysisId: latestProgress.analysisId.toString(),
                skill: latestProgress.skill,
                stepTitle: latestProgress.stepTitle,
                stepNumber: latestProgress.stepNumber,
                resourceTitle: latestProgress.resourceTitle,
                resourceUrl: latestProgress.resourceUrl,
                resourceType: latestProgress.resourceType,
                resourceProvider: latestProgress.resourceProvider,
                clickedAt: latestProgress.clickedAt
            }
        });

    } catch (error) {
        console.error('Get latest progress error:', error);
        const errorResponse = handleError(error);
        return new Response(JSON.stringify(errorResponse.body), {
            status: errorResponse.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
