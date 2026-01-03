import connectDB from '@/lib/db';
import ProgressTracking from '@/lib/models/ProgressTracking';
import User from '@/lib/models/User';
import { getUserFromRequest } from '@/lib/authServer';
import { handleError, createSuccessResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/progress
 * Log a resource click for progress tracking
 */
export async function POST(request) {
    try {
        // Get authenticated user
        const user = await getUserFromRequest(request);

        // Parse request body
        const body = await request.json();
        const {
            analysisId,
            stepId,
            resourceIndex,
            skill,
            stepTitle,
            stepNumber,
            resourceTitle,
            resourceUrl,
            resourceType,
            resourceProvider
        } = body;

        // Validate required fields
        if (!analysisId || !stepId || resourceIndex === undefined || !skill ||
            !stepTitle || !stepNumber || !resourceTitle || !resourceUrl || !resourceType) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Connect to database
        await connectDB();

        // Create progress tracking entry
        const progress = await ProgressTracking.create({
            userId: user._id,
            analysisId,
            stepId,
            resourceIndex,
            skill,
            stepTitle,
            stepNumber,
            resourceTitle,
            resourceUrl,
            resourceType,
            resourceProvider: resourceProvider || null,
            clickedAt: new Date()
        });

        // Update user's lastProgress reference
        await User.findByIdAndUpdate(user._id, {
            lastProgress: progress._id
        });

        return createSuccessResponse({
            message: 'Progress logged successfully',
            progressId: progress._id.toString()
        });

    } catch (error) {
        console.error('Progress logging error:', error);
        const errorResponse = handleError(error);
        return new Response(JSON.stringify(errorResponse.body), {
            status: errorResponse.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
