"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { resumeApi, authApi, progressApi } from '@/lib/api'
import { useRequireAuth } from '@/lib/authClient'
import { Clock, ExternalLink, TrendingUp } from 'lucide-react'

function formatDate(d) {
  try { return new Date(d).toLocaleString() } catch (e) { return d }
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function Dashboard() {
  const { isLoading: authLoading } = useRequireAuth()
  const router = useRouter()
  const [resumes, setResumes] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastProgress, setLastProgress] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const resumesPerPage = 10
  const pollingInterval = useRef(null)

  // Fetch dashboard data (resumes + progress)
  const fetchDashboardData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true)

      // Fetch user profile, ALL resumes, and latest progress
      const [profileData, resumeData, progressData] = await Promise.all([
        authApi.getProfile(),
        resumeApi.getAllAnalyses({ all: true }), // ✅ Fetch all resumes without limit
        progressApi.getLatestProgress()
      ])

      setUser(profileData.data.user)

      // Transform backend analyses to match dashboard format
      const analyses = resumeData.data.analyses.map(analysis => ({
        id: analysis.analysisId,
        uploadedAt: analysis.createdAt,
        fileName: analysis.fileName,
        jobRole: analysis.jobRole,
        matchPercent: analysis.matchPercent,
        analysisId: analysis.analysisId
      }))

      setResumes(analyses)

      // Set latest progress if exists
      if (progressData.data.progress) {
        setLastProgress(progressData.data.progress)
      }

      if (isInitialLoad) setLoading(false)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      if (isInitialLoad) {
        setError(err.message || 'Failed to load dashboard data')
        setLoading(false)
      }
    }
  }

  // Initial data fetch + Setup polling
  useEffect(() => {
    fetchDashboardData(true)

    // ✅ Setup polling every 5 seconds for real-time updates
    pollingInterval.current = setInterval(() => {
      fetchDashboardData(false) // Silent refresh without loading state
    }, 5000)

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  const viewAnalysis = (resume) => {
    router.push(`/analysis?id=${resume.analysisId}`)
  }

  const continueWhereLeftOff = () => {
    if (lastProgress?.resourceUrl) {
      window.open(lastProgress.resourceUrl, '_blank')
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    // Scroll table into view smoothly without page transition
    setTimeout(() => {
      document.querySelector('.glass-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary dark:border-primary-dark mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/login" className="animated-btn animated-btn--primary">
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">Welcome back, {user?.fullName || 'User'}!</div>
          </div>
          <div className="flex gap-3">
            <Link href="/upload-resume" className="animated-btn animated-btn--primary">
              Upload New Resume
            </Link>
          </div>
        </div>

        {/* Continue Where You Left Off Card - Only show if progress exists */}
        {lastProgress && (
          <div className="glass-card p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="text-blue-600 dark:text-blue-300" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Continue Where You Left Off</h2>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Last Resource:</span>
                    <span className="text-gray-900 dark:text-gray-100">{lastProgress.resourceTitle}</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {lastProgress.resourceType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Skill:</span>
                    <span>{lastProgress.skill}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Step:</span>
                    <span>Step {lastProgress.stepNumber} - {lastProgress.stepTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                    <Clock size={14} />
                    <span>{formatTimeAgo(lastProgress.clickedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={continueWhereLeftOff}
                  className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-105"
                >
                  Continue Learning
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="font-semibold dark:text-gray-200">Resumes uploaded</div>
            <div className="text-3xl font-extrabold mt-3 dark:text-white">{resumes.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">All uploaded resume versions & analysis history</div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="font-semibold dark:text-gray-200">Job preferences</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {user?.jobPreferences?.length > 0 ? (
                user.jobPreferences.map((p, i) => (
                  <div key={i} className="px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700 dark:bg-gray-800 text-sm dark:text-gray-300">{p}</div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">No preferences set</div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <Link href="/profile" className="text-primary dark:text-primary-dark hover:underline">
                Manage preferences
              </Link>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="font-semibold dark:text-gray-200">Current course</div>
              {user?.currentCourse && <div className="text-sm text-gray-500 dark:text-gray-400">{user.currentCourse.provider}</div>}
            </div>

            {user?.currentCourse ? (
              <div className="mt-3">
                <div className="text-lg font-medium dark:text-gray-200">{user.currentCourse.title}</div>
                <div className="mt-2 bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                  <div style={{ width: `${user.currentCourse.progress}%` }} className="h-3 bg-primary dark:bg-primary-dark"></div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Progress: {user.currentCourse.progress}%</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">No active course</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="font-semibold dark:text-gray-200">Resume uploads & analyses</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-gray-500 dark:text-gray-400">
                  <th className="pb-2">Uploaded</th>
                  <th className="pb-2">File</th>
                  <th className="pb-2">Job role</th>
                  <th className="pb-2">Match</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.slice((currentPage - 1) * resumesPerPage, currentPage * resumesPerPage).map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 w-48">{formatDate(r.uploadedAt)}</td>
                    <td className="py-3 font-medium dark:text-gray-200">{r.fileName}</td>
                    <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{r.jobRole}</td>
                    <td className="py-3 text-sm"><span className="font-semibold dark:text-gray-200">{r.matchPercent}%</span></td>
                    <td className="py-3">
                      <button onClick={() => viewAnalysis(r)} className="animated-btn animated-btn--sm">View analysis</button>
                      <Link href="/upload-resume" className="ml-2 text-sm text-gray-600 dark:text-gray-400">Re-analyze</Link>
                    </td>
                  </tr>
                ))}

                {resumes.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-sm text-gray-500 dark:text-gray-400">No resume history yet. Upload a resume to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {resumes.length > resumesPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * resumesPerPage + 1} to {Math.min(currentPage * resumesPerPage, resumes.length)} of {resumes.length} resumes
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  ← Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(resumes.length / resumesPerPage) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-primary dark:bg-primary-dark text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(Math.ceil(resumes.length / resumesPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(resumes.length / resumesPerPage)}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}