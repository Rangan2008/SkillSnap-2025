import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini AI
if (!GEMINI_API_KEY) {
  console.error('❌ CRITICAL: GEMINI_API_KEY is not configured in environment variables');
  console.error('❌ AI analysis will not work. Please add GEMINI_API_KEY to your .env file');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

if (genAI) {
  console.log('✅ Gemini API initialized successfully');
  console.log('📦 SDK: @google/generative-ai');
}

/**
 * Analyze resume against job description using Gemini API
 * PRODUCTION-SAFE: No mock data, strict validation, SDK-only calls
 * @param {string} resumeText - Extracted resume text
 * @param {string} jdText - Extracted job description text
 * @returns {Promise<Object>} Analysis results with similarity percentage and phased roadmap
 */
export const analyzeResume = async (resumeText, jdText) => {
  // Validate Gemini API is available
  if (!genAI) {
    throw new Error('AI service is not available. Please ensure GEMINI_API_KEY is configured in environment variables.');
  }

  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('Resume text is empty. Please upload a valid resume.');
  }

  if (!jdText || jdText.trim().length === 0) {
    throw new Error('Job description text is empty. Please upload a valid job description.');
  }

  try {
    // ✅ FIXED: Use gemini-2.5-flash (stable, supports generateContent)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      }
    });

    console.log('🔧 Runtime: nodejs');
    console.log('🤖 Model: gemini-2.5-flash (stable, 1M tokens)');
    console.log('📊 Resume length:', resumeText.length, 'chars');
    console.log('📋 JD length:', jdText.length, 'chars');

    const prompt = `You are a professional ATS (Applicant Tracking System) and career intelligence engine with deep expertise in software engineering, data science, data analytics, and big data roles.

Your task is to analyze a resume against a job description and generate a COMPLETE, VALID, and MACHINE-READABLE JSON response.

INPUT:
- resume: {text}
- job_description: {jd}

CRITICAL OUTPUT RULES (STRICT):
1. You MUST return ALL required fields.
2. You MUST return valid JSON only (no markdown, no text).
3. You MUST ensure phasedRoadmap is an ARRAY.
4. phasedRoadmap MUST NOT be empty.
5. TECHNICAL SKILL FOCUS: In 'missingSkills', identify ONLY technical hard skills (e.g., Programming Languages, Frameworks, Tools, Platforms, Databases, Technical Concepts like AJAX/OOP). Do NOT list soft skills (e.g., "Communication", "Teamwork").
6. MANDATORY INDIVIDUAL ROADMAPS:
   - For every single item listed in 'missingSkills', you MUST generate a corresponding entry in 'phasedRoadmap'.
   - Exception: You may only group tightly coupled standards (e.g., "HTML" + "CSS" can be one roadmap).
   - For specific concepts like "AJAX", "OOP", or "DOM Manipulation", generate a dedicated roadmap step that focuses specifically on mastering that concept within the context of the required language (e.g., "OOP in JavaScript").
7. RESUME IMPROVEMENT LOGIC: Any technical skill found in 'missingSkills' MUST also be referenced in 'suggestions.resumeImprovements' with a specific tip on where/how to add it (e.g., "Add a 'Technical Skills' section listing AJAX and OOP").
8. ALL learning resources MUST include REAL, PUBLICLY ACCESSIBLE LINKS (URLs).

REQUIRED JSON RESPONSE STRUCTURE (MANDATORY):

{
  "extractedJobTitle": "",
  "similarityPercentage": "XX",
  "matchPercent": "XX",
  "atsScore": "XX",
  "atsScoreExplanation": "",
  "skillsFound": [],
  "missingSkills": [],
  "suggestions": {
    "resumeImprovements": [
      "Tip 1: Add [Missing Skill X] to your skills section...",
      "Tip 2: Mention [Missing Skill Y] in a project description..."
    ],
    "alternativeBulletPoints": [],
    "atsOptimizedSummary": ""
  },
  "phasedRoadmap": [
    {
      "skill": "Exact Name of the Missing Skill (e.g. 'AJAX')",
      "skillsCovered": ["AJAX"],
      "phases": [
        {
          "phase": "Fundamentals",
          "goal": "Understand the core concepts...",
          "duration": "1-2 Weeks",
          "learningResources": {
            "courses": [
              { "title": "Course Title", "url": "https://valid-url.com" }
            ],
            "youtube": [
              { "title": "Video Title", "url": "https://valid-url.com" }
            ],
            "documentation": [
              { "title": "Doc Title", "url": "https://valid-url.com" }
            ],
            "projects": [
              { "title": "Project Title", "url": "https://valid-url.com" }
            ]
          }
        },
        {
          "phase": "Intermediate",
          "goal": "Apply this skill in scenarios...",
          "duration": "2 Weeks",
          "learningResources": {
            "courses": [],
            "youtube": [],
            "documentation": [],
            "projects": []
          }
        },
        {
          "phase": "Advanced",
          "goal": "Master complex use cases...",
          "duration": "2 Weeks",
          "learningResources": {
            "courses": [],
            "youtube": [],
            "documentation": [],
            "projects": []
          }
        }
      ]
    }
  ]
}

FIELD LOGIC:
- extractedJobTitle → infer from job description
- similarityPercentage → semantic similarity between resume and JD
- matchPercent → ATS keyword match score
- atsScore → numeric string (0–100)
- atsScoreExplanation → short justification
- skillsFound → JD skills present in resume
- missingSkills → CRITICAL TECHNICAL SKILLS from JD missing in resume (No soft skills).
- phasedRoadmap → MUST be an ARRAY of skill objects.
- skill → The specific name of the skill (e.g., "AJAX", "Object Oriented Programming").
- skillsCovered → ARRAY containing the exact single string from 'missingSkills' that this roadmap addresses.

RESOURCE LINK RULES (VERY IMPORTANT):
- Every resource MUST include a valid HTTPS URL.
- Prefer official documentation, well-known platforms, and reputable creators.
- Examples:
  - Documentation → official docs (react.dev, angular.io, developer.mozilla.org)
  - Courses → Coursera, Udemy, freeCodeCamp
  - YouTube → Fireship, Traversy Media, freeCodeCamp, Academind
  - Projects → GitHub repositories, official tutorials
- Do NOT use placeholders like "#", "example.com", or null URLs.

FAIL-SAFE RULE:
If missingSkills is empty, generate phasedRoadmap items for strengthening the top 3 critical technical skills found in the JD.

IMPORTANT:
- Do NOT return phasedRoadmap as an object.
- Do NOT omit phasedRoadmap.
- Do NOT return an empty array.
- Invalid structure will break roadmap generation.

You are responsible for producing a response that passes backend validation without errors.
`.replace('{text}', resumeText).replace('{jd}', jdText);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini response received, length:', text.length);

    // Clean response (remove markdown code blocks if present)
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('Raw response preview:', cleanedText.substring(0, 500));

      // Try to repair truncated JSON by closing brackets
      try {
        let repairedText = cleanedText.trim();

        // Remove trailing incomplete content (e.g., incomplete strings or values)
        // Find the last complete JSON value (ending with }, ], ", or digit)
        const lastValidChar = repairedText.search(/[}\]"\d](?!.*[}\]"\d])/);
        if (lastValidChar > 0) {
          repairedText = repairedText.substring(0, lastValidChar + 1);
        }

        // Count opening and closing braces/brackets
        const openBraces = (repairedText.match(/\{/g) || []).length;
        const closeBraces = (repairedText.match(/\}/g) || []).length;
        const openBrackets = (repairedText.match(/\[/g) || []).length;
        const closeBrackets = (repairedText.match(/\]/g) || []).length;

        // Close arrays and objects in reverse order (innermost first)
        for (let i = 0; i < (openBrackets - closeBrackets); i++) {
          repairedText += ']';
        }
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          repairedText += '}';
        }

        console.log('🔧 Attempting JSON repair...');
        console.log('📊 Missing brackets:', openBrackets - closeBrackets);
        console.log('📊 Missing braces:', openBraces - closeBraces);

        analysis = JSON.parse(repairedText);
        console.log('✅ JSON repaired successfully');
      } catch (repairError) {
        console.error('❌ JSON repair failed:', repairError.message);
        console.error('Cleaned text length:', cleanedText.length);

        // Log the last 200 characters to see what might be truncated
        console.error('Last 200 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 200)));

        throw new Error('AI response was truncated or invalid. The analysis may be too complex. Please try with a shorter resume or job description.');
      }
    }

    // STRICT VALIDATION: Ensure ALL required fields exist (NO MOCK DATA FALLBACKS)
    const requiredFields = [
      'extractedJobTitle',
      'similarityPercentage',
      'matchPercent',
      'atsScore',
      'atsScoreExplanation',
      'skillsFound',
      'missingSkills',
      'suggestions',
      'phasedRoadmap'
    ];

    const missingFields = requiredFields.filter(field => !(field in analysis));
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      throw new Error(`AI response incomplete. Missing: ${missingFields.join(', ')}. Please try again.`);
    }

    // Validate data types
    if (typeof analysis.extractedJobTitle !== 'string' || analysis.extractedJobTitle.trim() === '') {
      throw new Error('AI did not extract a valid job title. Please try again.');
    }

    if (!Array.isArray(analysis.skillsFound) || !Array.isArray(analysis.missingSkills)) {
      throw new Error('AI returned invalid skills data. Please try again.');
    }

    // Return ONLY validated real data (NO defaults, NO mock values)
    console.log('✅ Analysis validated successfully');
    return {
      extractedJobTitle: analysis.extractedJobTitle,
      similarityPercentage: Math.min(100, Math.max(0, Number(analysis.similarityPercentage))),
      matchPercent: Math.min(100, Math.max(0, Number(analysis.matchPercent))),
      atsScore: Math.min(100, Math.max(0, Number(analysis.atsScore))),
      atsScoreExplanation: String(analysis.atsScoreExplanation),
      skillsFound: analysis.skillsFound,
      missingSkills: analysis.missingSkills,
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      strengthAreas: Array.isArray(analysis.strengthAreas) ? analysis.strengthAreas : [],
      improvementAreas: Array.isArray(analysis.improvementAreas) ? analysis.improvementAreas : [],
      phasedRoadmap: Array.isArray(analysis.phasedRoadmap) ? analysis.phasedRoadmap : []
    };

  } catch (error) {
    // PRODUCTION-SAFE ERROR HANDLING: Never return mock data, fail honestly
    console.error('❌ Gemini API Error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status,
      modelUsed: 'gemini-2.5-flash',
      runtime: 'nodejs',
      timestamp: new Date().toISOString()
    });

    // Map specific errors to user-friendly messages
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw new Error('AI service authentication failed. Please contact support.');
    }

    if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
      throw new Error('AI service quota exceeded. The free tier limit has been reached. Please try again tomorrow or contact support to upgrade to a paid plan.');
    }

    if (error.message.includes('not found') || error.message.includes('404') || error.message.includes('model')) {
      throw new Error('AI model is not available. This may be due to quota limits. Please try again later or contact support.');
    }

    if (error.message.includes('temporarily unavailable') || error.message.includes('Health Check Failed')) {
      throw error; // Re-throw health check failures
    }

    if (error.message.includes('invalid JSON') || error.message.includes('incomplete') || error.message.includes('did not extract')) {
      throw error; // Re-throw validation errors
    }

    // Generic fallback
    throw new Error(`AI analysis failed: ${error.message}. Please try again or contact support if the issue persists.`);
  }
};

/**
 * Generate personalized learning roadmap using Gemini API
 * Now converts phased roadmap from analysis into step format
 * @param {Array} missingSkills - Skills to learn
 * @param {string} jobRole - Target job role
 * @param {string} experienceLevel - Current experience level
 * @param {Array} existingSkills - Skills already possessed
 * @param {Array} phasedRoadmap - Phased roadmap from analysis (optional)
 * @returns {Promise<Object>} Roadmap with learning steps
 */
export const generateRoadmap = async (missingSkills, jobRole, experienceLevel, existingSkills = [], phasedRoadmap = []) => {
  // If phased roadmap is provided from analysis, convert it to steps format
  if (phasedRoadmap && phasedRoadmap.length > 0) {
    console.log('📝 Converting phased roadmap to steps format');
    const steps = [];
    let stepNumber = 1;
    // Helper: normalize resource type to schema enum
    const normalizeResourceType = (rawType) => {
      if (!rawType) return 'documentation';
      const t = String(rawType).toLowerCase();
      if (t === 'doc' || t === 'documentation' || t === 'docs' || t === 'article') return 'documentation';
      if (t === 'youtube' || t === 'video') return 'video';
      if (t === 'course' || t === 'class' || t === 'tutorial') return 'course';
      if (t === 'project' || t === 'exercise') return 'project';
      if (t === 'book') return 'book';
      // fallback to 'documentation' which is allowed by schema
      return 'documentation';
    };

    // Helper: split composite skill labels into atomic skill names
    const splitSkills = (skillLabel) => {
      if (!skillLabel) return [];
      return String(skillLabel)
        .split(/[,/&]+|\band\b|\+|\\u0026/gi)
        .map(s => s.trim())
        .filter(Boolean);
    };

    for (const skillRoadmap of phasedRoadmap) {
      const rawSkillLabel = skillRoadmap.skill || skillRoadmap.name || 'Unknown Skill';
      const atomicSkills = splitSkills(rawSkillLabel);
      const skillNames = atomicSkills.length > 0 ? atomicSkills : ['Unknown Skill'];

      if (skillRoadmap.phases && Array.isArray(skillRoadmap.phases)) {
        for (const phase of skillRoadmap.phases) {
          const resources = [];
          if (phase.learningResources) {
            const lr = phase.learningResources;

            const extractResources = (arr, suggestedType) =>
              (arr || []).map(item => {
                // item may be string or object
                if (typeof item === 'object' && item !== null) {
                  return {
                    type: normalizeResourceType(item.type || suggestedType),
                    title: item.title || item.name || String(item.title || item.name || ''),
                    url: item.url || item.link || '',
                    provider: item.provider || item.channel || 'Unknown'
                  };
                }
                // if it's a string, we can't infer url reliably; place as title with empty url
                return {
                  type: normalizeResourceType(suggestedType),
                  title: String(item),
                  url: '',
                  provider: 'Unknown'
                };
              });

            resources.push(...extractResources(lr.courses, 'course'));
            resources.push(...extractResources(lr.youtube, 'video'));
            resources.push(...extractResources(lr.documentation, 'documentation'));
            resources.push(...extractResources(lr.projects, 'project'));
          }

          // Build step object WITHOUT a manual _id (let MongoDB generate it)
          steps.push({
            stepNumber: stepNumber,
            title: `${skillNames.join(' & ')}: ${phase.phase}`,
            description: phase.goal || phase.description || `Complete ${phase.phase} for ${skillNames.join(', ')}`,
            estimatedDuration: phase.duration || '1-2 weeks',
            skills: skillNames,
            resources,
            status: 'not_started',
            progressPercent: 0
          });
          stepNumber++;
        }
      }
    }
    const totalWeeks = steps.length * 2;
    const months = Math.ceil(totalWeeks / 4);
    return {
      totalEstimatedDuration: `${months}-${months + 1} months`,
      steps
    };
  }
  // If no phased roadmap provided, throw error
  if (!phasedRoadmap || phasedRoadmap.length === 0) {
    throw new Error('No learning roadmap was generated from the AI analysis. This may indicate an issue with the analysis results.');
  }
  throw new Error('Unable to generate learning roadmap. Please try analyzing your resume again.');
};
