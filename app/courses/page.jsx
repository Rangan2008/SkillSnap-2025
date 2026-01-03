"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Courses(){
  const [course, setCourse] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(()=>{
    try{
      const raw = localStorage.getItem('currentCourse')
      if(!raw){
        setCourse(null)
        return
      }

      const parsed = JSON.parse(raw)
      setCourse(parsed)

      // simulate automated progress when the user visits the page
      // compute a target progress (add 10-30%) and advance gradually
      const current = parsed.progress || 0
      const inc = Math.floor(10 + Math.random()*20) // 10-29
      const target = Math.min(100, current + inc)
      setUpdating(true)
      let interval = null
      interval = setInterval(()=>{
        setCourse(prev=>{
          if(!prev) return prev
          const nextVal = Math.min(target, (prev.progress||0)+1)
          const updated = {...prev, progress: nextVal}
          localStorage.setItem('currentCourse', JSON.stringify(updated))
          if(nextVal>=target){
            clearInterval(interval)
            setUpdating(false)
          }
          return updated
        })
      }, 150)

      return ()=> clearInterval(interval)
    }catch(e){
      console.error(e)
    }
  },[])

  if(course===null) return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6 rounded-2xl">
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">No active course found. Visit the Dashboard to pick one.</p>
          <div className="mt-4">
            <Link href="/dashboard" className="animated-btn">Back to dashboard</Link>
          </div>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">{course.provider}</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{course.progress}%</div>
          </div>

          <div className="mt-4">
            <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
              <div style={{width:`${course.progress}%`}} className="h-3 bg-primary transition-all"></div>
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{updating ? 'Updating progress while you learn…' : 'Progress saved'}</div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/dashboard" className="animated-btn">Back to dashboard</Link>
            <a href="#" className="animated-btn animated-btn--sm">Open course material</a>
          </div>
        </div>
      </div>
    </main>
  )
}