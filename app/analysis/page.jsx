"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, TrendingUp, FileText } from 'lucide-react'
import { resumeApi } from '@/lib/api'
import { useRequireAuth } from '@/lib/authClient'

// Circular Progress Component
function CircularProgress({ percentage }) {
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg className="transform -rotate-90 w-64 h-64">
        {/* Background circle */}
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="128"
          cy="128"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-6xl font-bold text-gray-900 dark:text-black"
        >
          {Math.round(percentage)}%
        </motion.div>
        <div className="text-sm text-gray-500 dark:text-black mt-2">Match Score</div>
      </div>
    </div>
  )
}

function AnalysisContent() {
  const { isLoading: authLoading } = useRequireAuth()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')
  
  const [data, setData] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFixPanel, setShowFixPanel] = useState(false)

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) {
        setError('No analysis ID provided. Please upload and analyze a resume first.')
        setLoading(false)
        return
      }

      try {
        const result = await resumeApi.getAnalysis(analysisId)
        const analysis = result.data.analysis

        // Validate required data exists
        if (!analysis) {
          throw new Error('Analysis data is missing from the server response.')
        }

        // Check for essential fields
        if (typeof analysis.similarityPercentage === 'undefined' && typeof analysis.matchPercent === 'undefined') {
          throw new Error('Analysis scores are missing. The AI analysis may have been incomplete.')
        }

        if (!Array.isArray(analysis.skillsFound) || !Array.isArray(analysis.missingSkills)) {
          throw new Error('Skill analysis data is incomplete.')
        }

        // Transform backend data to match frontend expectations
        setData({
          fileName: result.data.metadata.fileName,
          matchPercent: analysis.matchPercent || 0,
          similarityPercentage: analysis.similarityPercentage || analysis.matchPercent || 0,
          atsScore: analysis.atsScore || 0,
          atsScoreExplanation: analysis.atsScoreExplanation || 'No explanation available.',
          skillsFound: analysis.skillsFound || [],
          missingSkills: analysis.missingSkills || [],
          jobRole: result.data.metadata.jobRole,
          analysis: analysis
        })

        // Load user from localStorage
        const u = localStorage.getItem('user')
        if (u) setUser(JSON.parse(u))

        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch analysis:', err)
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to load analysis results.'
        
        if (err.message.includes('404') || err.message.includes('not found')) {
          errorMessage = 'Analysis not found. It may have been deleted or the link is invalid.'
        } else if (err.message.includes('Unauthorized') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please log in again to view your analysis.'
        } else if (err.message.includes('incomplete') || err.message.includes('missing')) {
          errorMessage = `Analysis Error: ${err.message} Please try analyzing your resume again.`
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.'
        } else {
          errorMessage = err.message || errorMessage
        }
        
        setError(errorMessage)
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [analysisId])

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-black">Loading analysis...</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-black">Loading analysis...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-black mb-2">Unable to Load Analysis</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error || 'Analysis data could not be retrieved.'}</p>
          </div>
          <div className="space-y-3">
            <Link href="/upload-resume" className="block w-full animated-btn animated-btn--primary">
              Upload New Resume
            </Link>
            <Link href="/dashboard" className="block w-full text-gray-600 dark:text-black hover:text-gray-900 dark:hover:text-black underline text-sm">
              Back to Dashboard
            </Link>
          </div>
          <div className="mt-6 text-xs text-gray-500 dark:text-black">
            <p>If this problem persists, please contact support.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <div className="border-b border-gray-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Skill Match Result</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-white">AI-powered analysis based on your uploaded resume</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Match Score Card - Primary Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <CircularProgress percentage={data.similarityPercentage} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium mb-4">
                <FileText size={16} />
                {data.fileName}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-black mb-3">
                Resume-JD Similarity: {data.similarityPercentage}%
              </h2>
              <p className="text-gray-600 dark:text-black leading-relaxed mb-4">
                Your resume matches {data.similarityPercentage}% of the job description requirements. 
                Focus on the missing skills below to increase alignment and improve your chances.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-black">ATS Score: </span>
                    <span className="font-bold text-primary">{data.atsScore}/100</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-black">{data.skillsFound.length} Skills Found</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600 dark:text-black">{data.missingSkills.length} Skills Missing</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skills Analysis Section - Two Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Skills Found Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-xl">
                <CheckCircle className="text-green-600 dark:text-green-300" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-black">Skills Found</h3>
                <p className="text-sm text-gray-500 dark:text-black">Great! You have these skills</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {data.skillsFound.map((skill, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all cursor-default"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Missing Skills Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-xl">
                <AlertTriangle className="text-red-600 dark:text-red-300" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-black">Missing Skills</h3>
                <p className="text-sm text-gray-500 dark:text-black">Work on these to improve your score</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {data.missingSkills.map((skill, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all cursor-default"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ATS Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-8 md:p-12 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <CircularProgress percentage={data.atsScore} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ATS Compatibility Score
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-black mb-3">
                Your ATS Score: {Math.round(data.atsScore)}/100
              </h2>
              <p className="text-gray-600 dark:text-black leading-relaxed mb-6">
                {data.atsScore > 90 ? (
                  "Excellent! Your resume is well-optimized for Applicant Tracking Systems. It has a high chance of passing automated screenings and reaching human recruiters."
                ) : (
                  "Your resume's ATS compatibility can be improved. Optimizing your resume for ATS will increase your chances of getting past automated screenings and landing interviews."
                )}
              </p>
              {data.atsScore <= 90 && (
                <button 
                  onClick={() => setShowFixPanel(true)}
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all hover:scale-105 hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Fix Now
                </button>

              )}
            </div>
          </div>
        </motion.div>

        {/* Call-to-Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] p-8 md:p-12 text-center text-gray-900 dark:text-black relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gray-300 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-400 rounded-full opacity-10 blur-3xl"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-700 to-black rounded-2xl mb-6">
              <TrendingUp size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 dark:text-black">Want to bridge the skill gap?</h2>
            <p className="text-gray-600 dark:text-black text-lg mb-8 max-w-2xl mx-auto">
              Get a personalized learning path for your missing skills. Our AI-powered recommendations will help you master the skills you need.
            </p>
            <Link
              href={`/bridging-the-gap?id=${analysisId}`}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-black transition-all hover:scale-105 hover:shadow-2xl"
            >
              Start Learning Path
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Side Panel for ATS Fixes */}
      {showFixPanel && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFixPanel(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-black">ATS Optimization Guide</h3>
                <p className="text-sm text-gray-500 dark:text-black">Recommended fixes for your resume</p>
              </div>
              <button
                onClick={() => setShowFixPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* ATS Score Explanation - moved here */}
              {data.atsScoreExplanation && (
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="font-semibold text-blue-900 dark:text-black mb-2">AI ATS Score Explanation</div>
                  <div className="text-gray-700 dark:text-black text-sm whitespace-pre-line">{data.atsScoreExplanation}</div>
                </div>
              )}
              {/* Fix Items */}
              {[
                {
                  icon: '📝',
                  title: 'Use Standard Section Headers',
                  description: 'ATS systems look for standard headings like "Work Experience", "Education", "Skills". Avoid creative titles like "My Journey" or "What I Know".',
                  priority: 'High',
                  color: 'red'
                },
                {
                  icon: '🎯',
                  title: 'Add Relevant Keywords',
                  description: 'Include job-specific keywords from the job description. ATS scans for exact matches of skills and qualifications mentioned in the posting.',
                  priority: 'High',
                  color: 'red'
                },
                {
                  icon: '📄',
                  title: 'Simplify Formatting',
                  description: 'Avoid tables, text boxes, headers/footers, and complex layouts. Use a simple, single-column format with standard fonts like Arial or Calibri.',
                  priority: 'High',
                  color: 'red'
                },
                {
                  icon: '📅',
                  title: 'Use Standard Date Formats',
                  description: 'Write dates in a consistent format (e.g., "Jan 2020 - Dec 2022"). Avoid symbols like "/" or "-" between month and year.',
                  priority: 'Medium',
                  color: 'yellow'
                },
                {
                  icon: '💼',
                  title: 'Include Job Titles',
                  description: 'Clearly list your job titles for each position. ATS systems specifically search for role titles to match against job requirements.',
                  priority: 'High',
                  color: 'red'
                },
                {
                  icon: '🔤',
                  title: 'Spell Out Acronyms',
                  description: 'Write out acronyms at least once (e.g., "Search Engine Optimization (SEO)"). This ensures ATS catches both versions.',
                  priority: 'Medium',
                  color: 'yellow'
                },
                {
                  icon: '📊',
                  title: 'Quantify Achievements',
                  description: 'Use numbers and metrics to describe accomplishments (e.g., "Increased sales by 25%"). This helps both ATS and human readers.',
                  priority: 'Medium',
                  color: 'yellow'
                },
                {
                  icon: '🎓',
                  title: 'List Certifications Clearly',
                  description: 'Create a dedicated section for certifications and licenses. Include the full name, issuing organization, and date.',
                  priority: 'Low',
                  color: 'blue'
                },
                {
                  icon: '📧',
                  title: 'Use a Professional Email',
                  description: 'Include a professional email address at the top of your resume. Avoid nicknames or unprofessional usernames.',
                  priority: 'Medium',
                  color: 'yellow'
                },
                {
                  icon: '🔗',
                  title: 'Save as .docx or PDF',
                  description: 'Most ATS systems prefer .docx format, but PDF is also widely accepted. Avoid .jpg, .png, or other image formats.',
                  priority: 'High',
                  color: 'red'
                }
              ].map((fix, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex gap-4">
                    <div className="text-3xl flex-shrink-0">{fix.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-black">{fix.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          fix.color === 'red' ? 'bg-red-100 text-red-700' :
                          fix.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {fix.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-black leading-relaxed">{fix.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Action Button */}
              <div className="pt-4">
                <button 
                  onClick={() => setShowFixPanel(false)}
                  className="w-full bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all hover:shadow-lg"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </main>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-black">Loading analysis...</p>
        </div>
      </main>
    }>
      <AnalysisContent />
    </Suspense>
  )
}

