import connectDB from '@/lib/db';
import ResumeAnalysis from '@/lib/models/ResumeAnalysis';
import { getUserFromRequest } from '@/lib/authServer';
import { isValidObjectId } from '@/lib/validation';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/resume-analysis/[analysisId]
 * Get specific resume analysis by ID
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

    console.log('📊 Fetching analysis:', { analysisId, userId: user._id.toString() });

    // Connect to database
    await connectDB();

    const analysis = await ResumeAnalysis.findOne({
      _id: analysisId,
      userId: user._id
    });

    if (!analysis) {
      console.log('❌ Analysis not found for user');
      return createErrorResponse('Analysis not found', 404);
    }

    console.log('✅ Analysis found:', analysis._id.toString());

    return createSuccessResponse({
      analysisId: analysis._id.toString(),
      analysis: analysis.analysis,
      roadmap: {
        totalEstimatedDuration: analysis.roadmap.totalEstimatedDuration,
        steps: analysis.roadmap.steps,
        overallProgress: analysis.overallProgress,
        generatedAt: analysis.roadmap.generatedAt
      },
      metadata: {
        fileName: analysis.fileName,
        resumeUrl: analysis.resumeUrl,
        jobRole: analysis.jobRole,
        experienceLevel: analysis.experienceLevel,
        jobDescription: analysis.jobDescription,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        lastProgressUpdate: analysis.lastProgressUpdate
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
 * DELETE /api/resume-analysis/[analysisId]
 * Delete a resume analysis
 */
export async function DELETE(request, { params }) {
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
    });

    if (!analysis) {
      return createErrorResponse('Analysis not found', 404);
    }

    // Delete from database
    await analysis.deleteOne();

    return createSuccessResponse(null, 'Analysis deleted successfully');

  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
