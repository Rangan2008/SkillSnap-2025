"use client"
// Hero: center-aligned headline, upload CTA, and how-it-works link
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function Hero(){
  const router = useRouter()
  const onUploadClick = ()=> router.push('/upload-resume')

  return (
    <section id="home" className="mt-30 py-20 min-h-[72vh] flex items-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <motion.h1 initial={{y:8,opacity:0}} animate={{y:0,opacity:1}} transition={{ duration:0.5 }} className="text-5xl sm:text-6xl font-extrabold">Discover Your Skill Gaps Instantly</motion.h1>
        <motion.p initial={{y:8,opacity:0}} animate={{y:0,opacity:1}} transition={{ delay:0.08 }} className="mt-3 text-xl text-gray-600 dark:text-gray-300">Upload your resume and get a personalized roadmap matched to your dream role — skills to learn, resources, and next steps.</motion.p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={onUploadClick} className="animated-btn animated-btn--primary">Upload Resume</button>
          <button onClick={()=>{document.querySelector('#howitworks')?.scrollIntoView({behavior:'smooth'})}} className="animated-btn">How it Works</button>
        </div>

      </div>
    </section>
  )
}