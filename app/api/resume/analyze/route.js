import connectDB from '@/lib/db';
import ResumeAnalysis from '@/lib/models/ResumeAnalysis';
import { getUserFromRequest } from '@/lib/authServer';
import { uploadResume } from '@/lib/cloudinary';
import { analyzeResume, generateRoadmap } from '@/lib/gemini';
import { validateResumeAnalysis } from '@/lib/validation';
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/errors';

// ✅ VERCEL-SAFE: Using nodejs runtime (required for mongoose)
// We no longer parse PDFs on server (that happens client-side)
// but we still need Node.js runtime for MongoDB/mongoose
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validate resume text quality
 * Moved from resumeParser.js for server-side validation
 */
function validateResumeText(text) {
  const trimmedText = text.trim();
  
  if (!trimmedText) {
    return {
      valid: false,
      error: 'Resume text is empty. Please ensure the file was parsed correctly.'
    };
  }
  
  if (trimmedText.length < 50) {
    return {
      valid: false,
      error: 'Resume text is too short (minimum 50 characters). Please ensure the file contains actual content.'
    };
  }
  
  if (trimmedText.length > 100000) {
    return {
      valid: false,
      error: 'Resume text is too long (maximum 100,000 characters). Please use a shorter resume.'
    };
  }
  
  // Check for common resume sections
  const hasEmail = /\S+@\S+\.\S+/.test(trimmedText);
  const hasPhone = /\+?\d{10,}/.test(trimmedText);
  const hasSections = /experience|education|skills|projects/i.test(trimmedText);
  
  if (!hasEmail && !hasPhone && !hasSections) {
    return {
      valid: true, // Still valid but warn
      warning: 'Resume may be missing standard sections (contact info, experience, skills, etc.)'
    };
  }
  
  return {
    valid: true,
    textLength: trimmedText.length
  };
}

/**
 * POST /api/resume/analyze
 * ✅ VERCEL-SAFE: Accepts extracted text instead of file
 * - Client extracts text from PDF using pdfjs-dist (browser)
 * - Server ONLY validates text and runs AI analysis
 * - No server-side PDF parsing = no crashes on Vercel
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);

    // Parse request body (JSON, not FormData)
    const body = await request.json();
    const { resumeText, jdText, resumeFileName, jdFileName, resumeFileSize, jdFileSize } = body;

    // Validate required fields
    if (!resumeText) {
      return createErrorResponse('Resume text is required. Please ensure the file was parsed correctly.', 400);
    }
    
    if (!resumeFileName) {
      return createErrorResponse('Resume file name is required', 400);
    }

    if (!jdText) {
      return createErrorResponse('Job description text is required. Please ensure the JD file was parsed correctly.', 400);
    }

    if (!jdFileName) {
      return createErrorResponse('Job description file name is required', 400);
    }

    console.log('📋 Received resume and JD:', {
      resumeFileName,
      jdFileName,
      resumeFileSize,
      jdFileSize,
      resumeTextLength: resumeText.length,
      jdTextLength: jdText.length
    });

    // Step 1: Validate extracted texts
    console.log('✅ Validating extracted texts...');
    const resumeValidation = validateResumeText(resumeText);
    if (!resumeValidation.valid) {
      return createErrorResponse(resumeValidation.error, 400);
    }

    const jdValidation = validateResumeText(jdText);
    if (!jdValidation.valid) {
      return createErrorResponse('Job description text is invalid: ' + jdValidation.error, 400);
    }
    
    console.log('✅ Text validations passed');

    // Step 2: Upload both files to Cloudinary
    const resumeBuffer = Buffer.from(resumeText, 'utf-8');
    const jdBuffer = Buffer.from(jdText, 'utf-8');
    
    const resumeUploadResult = await uploadResume(
      resumeBuffer, 
      resumeFileName.replace(/\.(pdf|docx?|doc)$/i, '.txt'), 
      user._id
    );

    const { uploadJobDescription } = await import('@/lib/cloudinary');
    const jdUploadResult = await uploadJobDescription(
      jdBuffer,
      jdFileName.replace(/\.(pdf|docx?|doc)$/i, '.txt'),
      user._id
    );

    console.log('✅ Files uploaded to Cloudinary');

    // Step 3: Analyze with Gemini AI using both resume and JD
    console.log('🤖 Analyzing resume against job description with AI...');
    let analysis;
    try {
      analysis = await analyzeResume(
        resumeText,
        jdText  // Pass JD text directly
      );
    } catch (aiError) {
      console.error('AI Analysis Error:', aiError.message);
      return createErrorResponse(
        `AI Analysis Failed: ${aiError.message}`,
        503  // Service Unavailable
      );
    }

    // Step 4: Generate learning roadmap from phased roadmap
    console.log('🗺️ Generating personalized roadmap...');
    let roadmap;
    try {
      roadmap = await generateRoadmap(
        analysis.missingSkills,
        analysis.extractedJobTitle || 'Target Role',
        'mid',  // Default experience level
        analysis.skillsFound,
        analysis.phasedRoadmap || []  // Pass phased roadmap from analysis
      );
    } catch (roadmapError) {
      console.error('Roadmap Generation Error:', roadmapError.message);
      return createErrorResponse(
        `Roadmap Generation Failed: ${roadmapError.message}`,
        503  // Service Unavailable
      );
    }

    // Step 5: Save to database
    if (roadmap && roadmap.steps) {
      console.log('🧭 Roadmap steps count:', roadmap.steps.length);
      console.log('🧭 Roadmap steps sample:', JSON.stringify(roadmap.steps.slice(0,2), null, 2));
    } else {
      console.warn('⚠️ Roadmap steps missing or empty:', roadmap);
    }
    console.log('💾 Saving analysis to database...');
    await connectDB();
    
    const resumeAnalysisDoc = await ResumeAnalysis.create({
      userId: user._id,
      resumeUrl: resumeUploadResult.url,
      fileName: resumeFileName,
      cloudinaryPublicId: resumeUploadResult.publicId,
      jobDescriptionUrl: jdUploadResult.url,
      jobDescriptionPublicId: jdUploadResult.publicId,
      jobRole: analysis.extractedJobTitle || 'Not specified',
      experienceLevel: 'mid',
      jobDescription: jdText.substring(0, 5000), // Store first 5000 chars
      analysis: {
        matchPercent: analysis.matchPercent,
        similarityPercentage: analysis.similarityPercentage,
        atsScore: analysis.atsScore,
        atsScoreExplanation: analysis.atsScoreExplanation || '',
        skillsFound: analysis.skillsFound,
        missingSkills: analysis.missingSkills,
        suggestions: analysis.suggestions,
        strengthAreas: analysis.strengthAreas || [],
        improvementAreas: analysis.improvementAreas || []
      },
      roadmap: {
        generatedAt: new Date(),
        totalEstimatedDuration: roadmap.totalEstimatedDuration,
        steps: roadmap.steps
      }
    });

    // Calculate initial progress
    resumeAnalysisDoc.calculateOverallProgress();
    await resumeAnalysisDoc.save();

    console.log('✅ Analysis complete!');

    return createSuccessResponse(
      {
        analysisId: resumeAnalysisDoc._id.toString(),
        analysis: {
          matchPercent: resumeAnalysisDoc.analysis.matchPercent,
          similarityPercentage: resumeAnalysisDoc.analysis.similarityPercentage,
          atsScore: resumeAnalysisDoc.analysis.atsScore,
          atsScoreExplanation: resumeAnalysisDoc.analysis.atsScoreExplanation,
          skillsFound: resumeAnalysisDoc.analysis.skillsFound,
          missingSkills: resumeAnalysisDoc.analysis.missingSkills,
          suggestions: resumeAnalysisDoc.analysis.suggestions,
          strengthAreas: resumeAnalysisDoc.analysis.strengthAreas,
          improvementAreas: resumeAnalysisDoc.analysis.improvementAreas
        },
        roadmap: {
          totalEstimatedDuration: resumeAnalysisDoc.roadmap.totalEstimatedDuration,
          steps: resumeAnalysisDoc.roadmap.steps,
          overallProgress: resumeAnalysisDoc.overallProgress
        },
        metadata: {
          fileName: resumeAnalysisDoc.fileName,
          jobRole: resumeAnalysisDoc.jobRole,
          experienceLevel: resumeAnalysisDoc.experienceLevel,
          createdAt: resumeAnalysisDoc.createdAt
        }
      },
      'Resume analyzed successfully',
      201
    );

  } catch (error) {
    console.error('Resume analysis error:', error);
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
