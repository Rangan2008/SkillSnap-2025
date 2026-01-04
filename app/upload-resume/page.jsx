"use client"

import { useCallback, useState } from 'react'
import { UploadCloud, FileText, Briefcase, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { resumeApi } from '@/lib/api'
import { useRequireAuth } from '@/lib/authClient'
import { extractResumeTextClient, isBrowserCompatible } from '@/lib/clientResumeParser'
import Lottie from 'lottie-react'
import animationData from '@/public/lottie/animation.json'

const ACCEPTED = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function UploadResume() {
  const { isLoading: authLoading } = useRequireAuth()
  
  const [resumeFile, setResumeFile] = useState(null)
  const [jdFile, setJdFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [extractionWarnings, setExtractionWarnings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState({ resume: false, jd: false })
  const [uploadProgress, setUploadProgress] = useState(0)

  const router = useRouter()

  const handleResumeFiles = useCallback(async (files) => {
    setError('')
    setExtractionWarnings([])
    setResumeText('')
    
    const f = files && files[0]
    if (!f) return
    
    if (!ACCEPTED.includes(f.type)) {
      setError('Unsupported file type. Please upload a PDF or Word document.')
      return
    }
    
    setResumeFile(f)
    setExtracting(prev => ({ ...prev, resume: true }))
    
    try {
      console.log('🔍 Extracting text from resume...')
      
      if (!isBrowserCompatible()) {
        throw new Error('Your browser does not support PDF parsing. Please use Chrome, Firefox, or Edge.')
      }
      
      const result = await extractResumeTextClient(f)
      
      if (result.requiresServerProcessing) {
        setResumeText('SERVER_PROCESSING_REQUIRED')
        setExtractionWarnings([`${result.fileType.toUpperCase()} files are processed on the server`])
      } else {
        setResumeText(result.text)
        setExtractionWarnings(result.warnings || [])
        console.log('✅ Resume extracted:', result.text.length, 'characters')
      }
    } catch (err) {
      console.error('❌ Resume extraction failed:', err)
      setError(`Failed to read resume: ${err.message}`)
      setResumeFile(null)
    } finally {
      setExtracting(prev => ({ ...prev, resume: false }))
    }
  }, [])

  const handleJdFiles = useCallback(async (files) => {
    const f = files && files[0]
    if (!f) return
    
    if (!ACCEPTED.includes(f.type)) {
      setError('Unsupported JD file type. Please upload PDF or Word.')
      return
    }
    
    setJdFile(f)
    setExtracting(prev => ({ ...prev, jd: true }))
    
    try {
      console.log('🔍 Extracting text from JD...')
      
      const result = await extractResumeTextClient(f)
      
      if (result.requiresServerProcessing) {
        setJdText('SERVER_PROCESSING_REQUIRED')
      } else {
        setJdText(result.text)
        console.log('✅ JD extracted:', result.text.length, 'characters')
      }
    } catch (err) {
      console.error('❌ JD extraction failed:', err)
      setError(`Failed to read job description: ${err.message}`)
      setJdFile(null)
    } finally {
      setExtracting(prev => ({ ...prev, jd: false }))
    }
  }, [])

  const onResumeDrop = (e) => {
    e.preventDefault()
    handleResumeFiles(e.dataTransfer.files)
  }

  const onJdDrop = (e) => {
    e.preventDefault()
    handleJdFiles(e.dataTransfer.files)
  }

  const onResumeChange = (e) => handleResumeFiles(e.target.files)
  const onJdChange = (e) => handleJdFiles(e.target.files)

  const handleJdPaste = (e) => {
    const pastedText = e.target.value
    setJdText(pastedText)
    // Clear file if user is typing in textarea
    if (pastedText.trim().length > 0) {
      setJdFile(null)
    }
  }

  const isFormValid = resumeFile && resumeText && jdText && !extracting.resume && !extracting.jd

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!resumeFile || !resumeText) { 
      setError('Please upload your resume')
      return 
    }
    if (!jdText || jdText.trim().length === 0) { 
      setError('Please provide a job description (paste text or upload file)')
      return 
    }

    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      // Send both resume and JD text to backend
      const data = await resumeApi.analyzeWithJD({
        resumeText,
        jdText,
        resumeFileName: resumeFile.name,
        jdFileName: jdFile ? jdFile.name : 'pasted-jd.txt',
        resumeFileSize: resumeFile.size,
        jdFileSize: jdFile ? jdFile.size : jdText.length
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const analysisId = data.data.analysisId
      if (!analysisId) {
        throw new Error('No analysis ID returned from server')
      }
      
      router.push(`/analysis?id=${analysisId}`)
    } catch (err) {
      console.error('Resume analysis error:', err)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to analyze resume. Please try again.'
      
      if (err.message.includes('AI Analysis Failed') || err.message.includes('AI service')) {
        errorMessage = '⚠️ AI Analysis Service Error: ' + err.message + ' Please ensure your files are valid and try again in a few moments.'
      } else if (err.message.includes('Roadmap Generation Failed')) {
        errorMessage = '⚠️ Roadmap Generation Error: ' + err.message + ' The analysis was incomplete. Please try again.'
      } else if (err.message.includes('Unauthorized')) {
        errorMessage = '🔒 Session expired. Please log in again.'
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = '🌐 Network error. Please check your internet connection and try again.'
      } else {
        errorMessage = err.message || errorMessage
      }
      
      setError(errorMessage)
      setLoading(false)
      setUploadProgress(0)
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-16 px-4">
      {/* Loading Animation Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 dark:bg-gray-900/95 z-50 flex flex-col items-center justify-center">
          <div className="w-96 h-96">
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
            />
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Analyzing Your Resume
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our AI is reviewing your resume and job description...
            </p>
            <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mx-auto">
              <div 
                className="bg-gradient-to-r from-primary to-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {uploadProgress}% Complete
            </p>
          </div>
        </div>
      )}
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI-Powered Resume Analysis</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Upload your resume and job description for personalized insights</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Resume Upload Card */}
            <div className="glass-card p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary-dark/10 text-primary dark:text-primary-dark">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Resume</h2>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">Upload your current resume</p>
                </div>
              </div>

              <div 
                onDrop={onResumeDrop} 
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary hover:bg-gray-50/50 transition-all duration-200"
              >
                {!resumeFile ? (
                  <label htmlFor="resume-input" className="flex flex-col items-center justify-center gap-4 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UploadCloud size={32} className="text-primary dark:text-primary-dark" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-800 dark:text-white">Drag & drop your resume</div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">or click to browse</div>
                    </div>
                    <input 
                      id="resume-input" 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      className="sr-only" 
                      onChange={onResumeChange}
                      disabled={extracting.resume || loading}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('resume-input').click()}
                      className="bg-primary text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                      disabled={extracting.resume || loading}
                    >
                      Browse Files
                    </button>
                    <div className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-300">PDF, DOC, DOCX • Max 10MB</div>
                  </label>
                ) : extracting.resume ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                      <FileText size={32} className="text-blue-600" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900 dark:text-white">Extracting text...</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Processing in browser</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <FileText size={32} className="text-green-600" />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                      <div className="flex items-start gap-3">
                        <FileText size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-black break-all">{resumeFile.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • {resumeText.length} characters
                          </div>
                        </div>
                      </div>
                    </div>
                    {extractionWarnings.length > 0 && (
                      <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-yellow-800">
                            {extractionWarnings.map((warning, idx) => (
                              <div key={idx}>• {warning}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setResumeFile(null)
                        setResumeText('')
                        setExtractionWarnings([])
                      }}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                      disabled={loading}
                    >
                      Remove file
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white-900 dark:text-blue-50 mb-3">📋 Resume Tips</h3>
                <ul className="space-y-2 text-xs font-medium text-gray-700 dark:text-blue-100">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Use your most recent resume</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Include clear technical skills section</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Avoid password-protected PDFs</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Job Description Upload Card */}
            <div className="glass-card p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-black dark:text-white">
                  <Briefcase size={28} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Job Description</h2>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">Paste text or upload file below</p>
                </div>
              </div>

              {/* Text Input Area - Always Visible */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  📝 Paste Job Description Text
                </label>
                <textarea
                  value={jdText}
                  onChange={handleJdPaste}
                  placeholder="Paste the complete job description here...&#10;&#10;Include:&#10;• Job title and role&#10;• Required skills and qualifications&#10;• Responsibilities&#10;• Experience requirements&#10;&#10;The more details you provide, the better the AI analysis!"
                  className="w-full h-64 p-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-600 outline-none resize-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={loading || extracting.jd}
                />
                {jdText && !jdFile && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-green-200">
                        {jdText.length} characters • Ready for analysis
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setJdText('')}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                      disabled={loading}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">OR</span>
                </div>
              </div>

              {/* File Upload Button */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  📁 Upload JD File (PDF, DOC, DOCX)
                </label>
                
                {!jdFile ? (
                  <div>
                    <input 
                      id="jd-input" 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      className="sr-only" 
                      onChange={onJdChange}
                      disabled={extracting.jd || loading}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('jd-input').click()}
                      disabled={extracting.jd || loading}
                      className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Briefcase size={24} />
                      <span>Upload Job Description File</span>
                    </button>
                    <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">Supports PDF, DOC, DOCX • Max 10MB</p>
                  </div>
                ) : extracting.jd ? (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                      <Briefcase size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Extracting text from file...</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Processing in browser</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Briefcase size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-black break-all">{jdFile.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {(jdFile.size / 1024 / 1024).toFixed(2)} MB • {jdText.length} characters extracted
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJdFile(null)
                        setJdText('')
                      }}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                      disabled={loading}
                    >
                      Remove file and use text input instead
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 bg-green-50 dark:bg-green-900 border border-green-100 dark:border-green-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-green-50 mb-3">💼 JD Tips</h3>
                <ul className="space-y-2 text-xs font-medium text-gray-700 dark:text-green-100">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Copy full JD from job posting or upload file</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Include requirements & qualifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>More detail = better AI analysis & matching</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-12 space-y-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-8 py-5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 hover:scale-105 transition-all shadow-xl hover:shadow-2xl text-lg uppercase tracking-wide"
              disabled={!isFormValid || loading}
            >
              {loading ? '⏳ Analyzing...' : (extracting.resume || extracting.jd) ? '📄 Extracting Text...' : '🚀 Get Your Roadmap'}
            </button>
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">← Back to home</Link>
            </div>
          </div>

          {!isFormValid && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Please upload both your resume and job description to continue
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
