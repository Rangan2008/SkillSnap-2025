import connectDB from '@/lib/db';
import ResumeAnalysis from '@/lib/models/ResumeAnalysis';
import { getUserFromRequest } from '@/lib/authServer';
import { handleError, createSuccessResponse } from '@/lib/errors';

// ✅ VERCEL: Use Node.js runtime (required for mongoose)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/resume-analysis
 * Get all resume analyses for current user
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const jobRole = searchParams.get('jobRole');
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    // Connect to database
    await connectDB();

    // Build query
    const query = { userId: user._id };
    if (jobRole) {
      query.jobRole = new RegExp(jobRole, 'i');
    }

    // If 'all' parameter is true, fetch without pagination
    if (all) {
      const analyses = await ResumeAnalysis.find(query)
        .sort({ [sortBy]: -1 })
        .select('-roadmap.steps.notes'); // Exclude notes for list view

      const total = analyses.length;

      return createSuccessResponse({
        analyses: analyses.map(a => ({
          analysisId: a._id.toString(),
          fileName: a.fileName,
          jobRole: a.jobRole,
          experienceLevel: a.experienceLevel,
          matchPercent: a.analysis.matchPercent,
          atsScore: a.analysis.atsScore,
          overallProgress: a.overallProgress,
          createdAt: a.createdAt,
          lastProgressUpdate: a.lastProgressUpdate
        })),
        total: total
      });
    }

    // Execute query with pagination
    const analyses = await ResumeAnalysis.find(query)
      .sort({ [sortBy]: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-roadmap.steps.notes'); // Exclude notes for list view

    const total = await ResumeAnalysis.countDocuments(query);

    return createSuccessResponse({
      analyses: analyses.map(a => ({
        analysisId: a._id.toString(),
        fileName: a.fileName,
        jobRole: a.jobRole,
        experienceLevel: a.experienceLevel,
        matchPercent: a.analysis.matchPercent,
        atsScore: a.analysis.atsScore,
        overallProgress: a.overallProgress,
        createdAt: a.createdAt,
        lastProgressUpdate: a.lastProgressUpdate
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
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
