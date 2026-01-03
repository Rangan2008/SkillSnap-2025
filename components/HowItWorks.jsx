"use client"
// HowItWorks: three-step cards that explain the flow (upload 14 role 14 path)
import { FileText, Briefcase, CheckSquare } from 'lucide-react'
import { motion } from 'framer-motion'

const steps = [
  {
    Icon: FileText,
    title: 'Upload Resume',
    text: 'Upload your CV (PDF or DOCX) so SkillSnap can extract skills, roles, and experience.'
  },
  {
    Icon: Briefcase,
    title: 'Select Job Role',
    text: 'Choose the job role you want to target; we map your skills to role requirements.'
  },
  {
    Icon: CheckSquare,
    title: 'Get Learning Path',
    text: 'Receive a bite-sized, prioritized learning path tailored to your gaps.'
  }
]

export default function HowItWorks(){
  return (
    <section id="howitworks" className="py-16" aria-labelledby="howitworks-title">
      <div className="max-w-6xl mx-auto px-4">
        <h2 id="howitworks-title" className="text-2xl font-bold text-center">How it Works</h2>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s, idx)=> (
            <motion.article key={s.title} whileHover={{ y: -6 }} className="glass-card p-6 rounded-2xl text-center" aria-labelledby={`step-${idx}`}>
              <div className="flex items-center justify-center">
                <s.Icon size={36} className="text-primary dark:text-white" aria-hidden />
              </div>
              <h3 id={`step-${idx}`} className="mt-4 font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{s.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}