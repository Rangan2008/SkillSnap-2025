"use client"
// DreamJobCTA: card-style CTA to prompt resume analysis and show an illustration
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import LottieAnimation from './LottieAnimation'

export default function DreamJobCTA() {
  const router = useRouter()
  const onAnalyze = () => {
    // navigate to the dedicated upload page where users can drag/drop or browse files
    router.push('/upload-resume')
  }

  return (
    <section id="dreamjob" className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="glass-card p-6 sm:p-10 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
          <div className="sm:w-1/2">
            <h3 className="text-2xl font-bold">Want to Get Dream Job</h3>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Analyze your resume to discover targeted skill gaps and get a clear learning roadmap to your target role.</p>
            <div className="mt-6">
              <button onClick={onAnalyze} className="animated-btn animated-btn--primary">Analyze Your Resume</button>
            </div>
          </div>

          <motion.div
            className="sm:w-1/2 flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="rounded-xl shadow-soft-lg">
              <LottieAnimation />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}