import connectDB from '@/lib/db';
import ResumeAnalysis from '@/lib/models/ResumeAnalysis';
import { getUserFromRequest } from '@/lib/authServer';
import { isValidObjectId } from '@/lib/validation';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/roadmap/[analysisId]
 * Get full roadmap for an analysis
 */
export async function GET(request, { params }) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);

    // Await params (Next.js 15+ requirement)
    const { analysisId } = await params;

    // Validate ID
    if (!isValidObjectId(analysisId)) {
      return createErrorResponse('Invalid analysis ID', 400);
    }

    // Connect to database
    await connectDB();

    const analysis = await ResumeAnalysis.findOne({
      _id: analysisId,
      userId: user._id
    }).select('roadmap overallProgress jobRole experienceLevel');

    if (!analysis) {
      return createErrorResponse('Analysis not found', 404);
    }

    return createSuccessResponse({
      roadmap: {
        totalEstimatedDuration: analysis.roadmap.totalEstimatedDuration,
        generatedAt: analysis.roadmap.generatedAt,
        steps: analysis.roadmap.steps
      },
      overallProgress: analysis.overallProgress,
      metadata: {
        jobRole: analysis.jobRole,
        experienceLevel: analysis.experienceLevel
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
