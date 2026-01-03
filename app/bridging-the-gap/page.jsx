"use client"

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, PlayCircle, BookOpen, Code, CheckCircle, X, Loader, Upload, AlertCircle } from 'lucide-react'
import { resumeApi, progressApi } from '@/lib/api'
import { isAuthenticated } from '@/lib/authClient'

function BridgingTheGapContent() {

  const [data, setData] = useState(null)
  const [roadmapData, setRoadmapData] = useState({})
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedRoadmapItem, setSelectedRoadmapItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchAnalysis()
  }, [router, analysisId])

  // Track resource click for progress tracking
  const trackResourceClick = async (resource, roadmapItem, skillName) => {
    try {
      // Find step number by looking through all roadmap steps
      let stepNumber = 1;
      if (data?.roadmap?.steps) {
        const matchingStep = data.roadmap.steps.find(step => step._id === roadmapItem.stepId);
        if (matchingStep) {
          stepNumber = matchingStep.stepNumber || stepNumber;
        }
      }

      await progressApi.logResourceClick({
        analysisId: data.analysisId,
        stepId: roadmapItem.stepId,
        resourceIndex: roadmapItem.resources.indexOf(resource),
        skill: skillName,
        stepTitle: roadmapItem.title,
        stepNumber: stepNumber,
        resourceTitle: resource.title,
        resourceUrl: resource.url,
        resourceType: resource.type,
        resourceProvider: resource.channel
      });
      console.log('✅ Progress tracked:', resource.title);
    } catch (err) {
      console.error('Failed to track progress:', err);
      // Don't block navigation on tracking failure
    }
  };

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      let targetAnalysisId = analysisId

      // If no analysisId provided in URL, fetch the latest one
      if (!targetAnalysisId) {
        const listResponse = await resumeApi.getAllAnalyses()

        console.log('API Response:', listResponse)

        if (!listResponse || !listResponse.success) {
          setError('Failed to fetch resume analysis. Please try again.')
          return
        }

        // Check if we have any analyses
        if (!listResponse.data || !listResponse.data.analyses || listResponse.data.analyses.length === 0) {
          setError('No resume analysis found. Please upload a resume first.')
          return
        }

        // Get the most recent analysis ID from the list
        const latestAnalysisSummary = listResponse.data.analyses[0]

        if (!latestAnalysisSummary || !latestAnalysisSummary.analysisId) {
          setError('Invalid analysis data received. Please upload a resume again.')
          return
        }

        targetAnalysisId = latestAnalysisSummary.analysisId
      }

      // Fetch full analysis details including roadmap
      const fullAnalysisResponse = await resumeApi.getAnalysis(targetAnalysisId)

      if (!fullAnalysisResponse || !fullAnalysisResponse.success) {
        setError('Failed to fetch full analysis details.')
        return
      }

      const fullAnalysis = fullAnalysisResponse.data

      // Structure data for the UI
      const analysisData = {
        analysisId: fullAnalysis.analysisId || targetAnalysisId,
        fileName: fullAnalysis.metadata?.fileName || 'Unknown',
        matchPercent: fullAnalysis.analysis?.matchPercent || 0,
        atsScore: fullAnalysis.analysis?.atsScore || 0,
        missingSkills: fullAnalysis.analysis?.missingSkills || [],
        skillsFound: fullAnalysis.analysis?.skillsFound || [],
        jobRole: fullAnalysis.metadata?.jobRole || 'Not specified',
        experienceLevel: fullAnalysis.metadata?.experienceLevel || 'entry',
        roadmap: fullAnalysis.roadmap || null
      }


      setData(analysisData)

      // Helper function to normalize skill names for consistent matching
      const normalizeSkillName = (skill) => {
        return skill
          .toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, '') // Remove special characters
          .replace(/\s+/g, ' '); // Normalize whitespace
      };

      // Convert roadmap steps to skill-based roadmap structure with normalization
      if (fullAnalysis.roadmap?.steps && Array.isArray(fullAnalysis.roadmap.steps)) {
        const skillRoadmap = {};
        const normalizedSkillMap = {}; // Maps normalized skill -> original skill name

        // First, build roadmap from steps
        fullAnalysis.roadmap.steps.forEach(step => {
          // Split composite skill labels into atomic skills (e.g. "Next.js & React Core" => ["Next.js", "React Core"])
          const stepSkills = (step.skills || []).flatMap(skill =>
            skill.split(/[,/&]+/).map(s => s.trim()).filter(Boolean)
          );

          stepSkills.forEach(skill => {
            const normalizedSkill = normalizeSkillName(skill);

            // Track the mapping from normalized to original skill name
            if (!normalizedSkillMap[normalizedSkill]) {
              normalizedSkillMap[normalizedSkill] = skill;
            }

            // Use the original skill name as the key
            if (!skillRoadmap[skill]) {
              skillRoadmap[skill] = [];
            }
            skillRoadmap[skill].push({
              stepId: step._id,
              title: step.title || 'Untitled Step',
              desc: step.description || '',
              duration: step.estimatedDuration || '1 week',
              status: step.status || 'not_started',
              progressPercent: step.progressPercent || 0,
              resources: (step.resources || []).map(r => ({
                type: r.type || 'doc',
                title: r.title || 'Resource',
                url: r.url || '#',
                channel: r.provider || 'Unknown'
              }))
            });
          });
        });

        // Now match missing skills to roadmap data using normalization
        const finalRoadmap = {};
        const missingSkillsWithData = [];
        const missingSkillsWithoutData = [];

        analysisData.missingSkills.forEach(missingSkill => {
          const normalizedMissing = normalizeSkillName(missingSkill);

          // Try to find a match in the roadmap
          let matchedRoadmapKey = null;

          // Check for exact match first
          if (skillRoadmap[missingSkill]) {
            matchedRoadmapKey = missingSkill;
          } else {
            // Check for normalized match
            for (const [roadmapSkill, steps] of Object.entries(skillRoadmap)) {
              if (normalizeSkillName(roadmapSkill) === normalizedMissing) {
                matchedRoadmapKey = roadmapSkill;
                break;
              }
            }
          }

          if (matchedRoadmapKey) {
            // Use the missing skill name as the key, but with roadmap data
            finalRoadmap[missingSkill] = skillRoadmap[matchedRoadmapKey];
            missingSkillsWithData.push(missingSkill);
          } else {
            missingSkillsWithoutData.push(missingSkill);
          }
        });

        setRoadmapData(finalRoadmap);
        console.log('✅ Roadmap structured:', Object.keys(finalRoadmap).length, 'skills with data');
        console.log('📊 Skills with roadmap:', missingSkillsWithData);
        if (missingSkillsWithoutData.length > 0) {
          console.warn('⚠️ Missing skills WITHOUT roadmap data:', missingSkillsWithoutData);
        }
      } else {
        console.warn('⚠️ No roadmap steps found');
      }

      console.log('✅ Loaded analysis from Gemini:', analysisData)


    } catch (err) {
      console.error('Error fetching analysis:', err)
      setError(err.message || 'Failed to load analysis data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600 dark:text-white">Loading your personalized roadmap...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-lg px-4">
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-10 shadow-xl">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-blue-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Resume Analysis Found</h2>
              <p className="text-gray-600 dark:text-white mb-2">
                You haven't uploaded and analyzed a resume yet.
              </p>
              <p className="text-sm text-gray-500 dark:text-white">
                Upload your resume to get a personalized AI-powered learning roadmap.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/upload-resume"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Upload & Analyze Resume
              </Link>
              <Link
                href="/dashboard"
                className="block w-full bg-gray-100 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>

            {error !== 'No resume analysis found. Please upload a resume first.' && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-800">Error Details</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  if (!data) return null

  return (
    <main className="min-h-screen ">
      {/* Header */}
      <div className="border-b dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bridge Your Skills Gap</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-white">Select a skill to view personalized learning roadmap</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Banner */}
        {data.jobRole && (
          <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-900 dark:text-black mb-1">
                  AI-Generated Learning Path for {data.jobRole}
                </h2>
                <p className="text-blue-700 dark:text-black text-sm">
                  Personalized roadmap based on your resume analysis • {data.missingSkills.length} skills to master
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900 dark:text-black">{data.matchPercent}%</div>
                <div className="text-xs text-blue-700 dark:text-black">Match Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Skills Grid */}
        {!selectedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {data.missingSkills.map((skill, i) => (
              <motion.button
                key={i}
                onClick={() => setSelectedSkill(skill)}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-left border-2 border-gray-200 hover:border-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Code className="text-white" size={28} />
                  </div>
                  <ChevronRight className="text-gray-400" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{skill}</h3>
                <p className="text-gray-600 dark:text-white text-sm">Click to view learning roadmap and resources</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-white font-medium">
                  <span>View Roadmap</span>
                  <ChevronRight size={16} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Roadmap View */}
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedSkill(null)
                setSelectedRoadmapItem(null)
              }}
              className="flex items-center gap-2 text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 font-medium"
            >
              <ChevronRight className="rotate-180" size={20} />
              Back to Skills
            </button>

            {/* Skill Header */}
            <div className="rounded-2xl p-8 shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Code className="text-white" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedSkill}</h2>
                  <p className="text-gray-600 dark:text-white">Learning Roadmap</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-white">
                Follow this structured path to master {selectedSkill}. Click on any step to view detailed resources and video tutorials.
              </p>
            </div>

            {/* Roadmap Steps */}
            <div className="space-y-4">
              {(roadmapData[selectedSkill] || []).length > 0 ? (
                (roadmapData[selectedSkill] || []).map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => setSelectedRoadmapItem(item)}
                      className="w-full rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-left border-2 border-gray-200 hover:border-purple-500 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full ${item.status === 'completed'
                            ? 'bg-green-500'
                            : item.status === 'in_progress'
                              ? 'bg-yellow-500'
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                            } flex items-center justify-center text-white font-bold text-lg`}>
                            {item.status === 'completed' ? <CheckCircle size={24} /> : index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-gray-600 dark:text-white text-sm mb-2">{item.desc}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-white">
                                  <BookOpen size={16} />
                                  {item.resources.length} Resources
                                </span>
                                <span className="text-gray-500 dark:text-white">⏱ {item.duration}</span>
                                {item.status && item.status !== 'not_started' && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'in_progress'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {item.status.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-purple-600 transition-colors" size={24} />
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 dark:text-white">No roadmap available for this skill yet.</p>
                  <p className="text-sm text-gray-500 dark:text-white mt-2">The AI is still generating personalized resources.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Resource Modal */}
      <AnimatePresence>
        {selectedRoadmapItem && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRoadmapItem(null)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
            >
              <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200 flex flex-col">
                {/* Modal Header */}
                <div className="bg-black p-6 text-white flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{selectedRoadmapItem.title}</h3>
                      <p className="text-gray-300">{selectedRoadmapItem.desc}</p>
                      <div className="mt-3 inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm">
                        ⏱ {selectedRoadmapItem.duration}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRoadmapItem(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-black rounded-full transition-colors flex-shrink-0"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-black mb-4">Learning Resources</h4>
                  <div className="space-y-3">
                    {selectedRoadmapItem.resources.map((resource, idx) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          // Track progress before navigation
                          trackResourceClick(resource, selectedRoadmapItem, selectedSkill);
                        }}
                        className="block p-4 border-2 border-gray-200 rounded-xl hover:border-black hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${resource.type === 'video'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-900'
                            }`}>
                            {resource.type === 'video' ? (
                              <PlayCircle size={24} />
                            ) : (
                              <BookOpen size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 dark:text-black group-hover:text-black transition-colors">
                              {resource.title}
                            </h5>
                            {resource.channel && (
                              <p className="text-sm text-gray-600 dark:text-black mt-1">{resource.channel}</p>
                            )}
                            <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-900 dark:text-black font-medium">
                              <span>{resource.type === 'video' ? 'Watch Video' : 'Read Documentation'}</span>
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}

export default function BridgingTheGap() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-white">Loading...</p>
        </div>
      </main>
    }>
      <BridgingTheGapContent />
    </Suspense>
  )
}
