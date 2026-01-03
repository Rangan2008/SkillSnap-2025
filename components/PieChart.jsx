"use client"

import React from 'react'

// Small SVG pie chart component. Accepts segments: [{label, value, color}]
export default function PieChart({segments = [], size = 200, stroke = 0}){
  const total = segments.reduce((s, seg)=> s + Math.max(0, seg.value), 0) || 1
  let cumulative = 0

  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2

  const slicePath = (start, end) => {
    const startAngle = 2 * Math.PI * start
    const endAngle = 2 * Math.PI * end
    const x1 = cx + radius * Math.cos(startAngle - Math.PI/2)
    const y1 = cy + radius * Math.sin(startAngle - Math.PI/2)
    const x2 = cx + radius * Math.cos(endAngle - Math.PI/2)
    const y2 = cy + radius * Math.sin(endAngle - Math.PI/2)
    const large = end - start > 0.5 ? 1 : 0
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {segments.map((seg, i)=>{
        const start = cumulative / total
        cumulative += Math.max(0, seg.value)
        const end = cumulative / total
        return <path key={i} d={slicePath(start, end)} fill={seg.color} />
      })}
    </svg>
  )
}
