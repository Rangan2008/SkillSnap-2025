import connectDB from '@/lib/db';
import ResumeAnalysis from '@/lib/models/ResumeAnalysis';
import { getUserFromRequest } from '@/lib/authServer';
import { isValidObjectId } from '@/lib/validation';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/roadmap/progress/[analysisId]/bulk
 * Update multiple roadmap steps at once
 */
export async function PATCH(request, { params }) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);

    // Await params (Next.js 15+ requirement)
    const { analysisId } = await params;
    const body = await request.json();
    const { updates } = body; // Array of { stepId, status, progressPercent, notes }

    // Validate analysis ID
    if (!isValidObjectId(analysisId)) {
      return createErrorResponse('Invalid analysis ID', 400);
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return createErrorResponse('Updates array is required', 400);
    }

    // Connect to database
    await connectDB();

    // Find the analysis
    const analysis = await ResumeAnalysis.findOne({
      _id: analysisId,
      userId: user._id
    });

    if (!analysis) {
      return createErrorResponse('Analysis not found', 404);
    }

    const updatedSteps = [];

    // Update each step
    for (const update of updates) {
      const { stepId, status, progressPercent, notes } = update;
      
      const step = analysis.roadmap.steps.id(stepId);
      if (!step) continue;

      const oldStatus = step.status;

      if (status) {
        step.status = status;
        if (status === 'in_progress' && oldStatus === 'not_started') {
          step.startedAt = new Date();
        }
        if (status === 'completed' && oldStatus !== 'completed') {
          step.completedAt = new Date();
          step.progressPercent = 100;
        }
      }

      if (progressPercent !== undefined) {
        step.progressPercent = progressPercent;
      }

      if (notes !== undefined) {
        step.notes = notes;
      }

      updatedSteps.push({
        stepId: step._id,
        stepNumber: step.stepNumber,
        title: step.title,
        status: step.status,
        progressPercent: step.progressPercent
      });
    }

    // Update timestamp and recalculate progress
    analysis.lastProgressUpdate = new Date();
    analysis.calculateOverallProgress();

    await analysis.save();

    return createSuccessResponse(
      {
        updatedSteps,
        overallProgress: analysis.overallProgress
      },
      'Bulk progress update successful'
    );

  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
