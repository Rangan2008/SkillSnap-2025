import connectDB from '@/lib/db';
import ResumeAnalysis from '@/lib/models/ResumeAnalysis';
import { getUserFromRequest } from '@/lib/authServer';
import { isValidObjectId, validateProgressUpdate } from '@/lib/validation';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/roadmap/progress/[analysisId]
 * Update roadmap step progress
 */
export async function PATCH(request, { params }) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);

    // Await params (Next.js 15+ requirement)
    const { analysisId } = await params;
    const body = await request.json();
    const { stepId, status, progressPercent, notes } = body;

    // Validate analysis ID
    if (!isValidObjectId(analysisId)) {
      return createErrorResponse('Invalid analysis ID', 400);
    }

    // Validate input
    const validation = validateProgressUpdate({ stepId, status, progressPercent });
    if (!validation.valid) {
      return createErrorResponse(validation.errors.join(', '), 400);
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

    // Find the specific step
    const step = analysis.roadmap.steps.id(stepId);
    
    if (!step) {
      return createErrorResponse('Roadmap step not found', 404);
    }

    // Update step fields
    const oldStatus = step.status;
    
    if (status) {
      step.status = status;
      
      // Update timestamps based on status change
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

    // Update last progress update timestamp
    analysis.lastProgressUpdate = new Date();

    // Recalculate overall progress
    analysis.calculateOverallProgress();

    // Save changes
    await analysis.save();

    return createSuccessResponse(
      {
        step: {
          stepId: step._id,
          stepNumber: step.stepNumber,
          title: step.title,
          status: step.status,
          progressPercent: step.progressPercent,
          notes: step.notes,
          startedAt: step.startedAt,
          completedAt: step.completedAt
        },
        overallProgress: analysis.overallProgress
      },
      'Progress updated successfully'
    );

  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
