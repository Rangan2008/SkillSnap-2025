"use client"
import { useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * DottedBackground
 * A performant canvas-backed dotted background that subtly reacts to cursor movement.
 * Props:
 *  - enabled (bool): toggle rendering
 *  - dotSize (number): base radius in px
 *  - spacing (number): spacing between dots in px
 *  - strength (number): how strongly dots repel (px of offset)
 *  - color (string): dot color (optional, will auto-detect from theme)
 *  - opacity (number): base opacity for dots
 *  - maxInfluence (number): influence radius
 *
 * Implementation notes:
 *  - Uses requestAnimationFrame for smooth animation
 *  - Uses devicePixelRatio scaling for crisp rendering on HiDPI
 *  - Respects prefers-reduced-motion and disables motion when set
 *  - Disables interaction on mobile (pointer coarse / touch devices)
 *  - Pointer-events are set to none so it never blocks clicks
 */
export default function DottedBackground({
  enabled = true,
  dotSize = 2,
  spacing = 36,
  strength = 18,
  color,
  opacity = 0.65,
  maxInfluence = 88
}) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const stateRef = useRef({ dots: [], mouse: { x: -9999, y: -9999 } })
  const { theme } = useTheme()

  // Auto-detect color based on theme if not provided
  const dotColor = color || (theme === 'dark' ? '#64748b' : '#cbd5e1')

  useEffect(() => {
    if (!enabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let dpr = Math.max(1, window.devicePixelRatio || 1)

    // Feature detection & user preferences
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches

    // If reduced motion or touch device, make it static (no interaction)
    const interactive = !prefersReduced && !isTouch

    function resize() {
      const { innerWidth: w, innerHeight: h } = window
      dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Rebuild grid of dots
      const cols = Math.ceil(w / spacing)
      const rows = Math.ceil(h / spacing)
      const dots = []
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * spacing + ((w - cols * spacing) / 2)
          const y = r * spacing + ((h - rows * spacing) / 2)
          dots.push({ x, y, ox: x, oy: y })
        }
      }
      stateRef.current.dots = dots
    }

    function onMove(e) {
      const x = e.clientX
      const y = e.clientY
      stateRef.current.mouse.x = x
      stateRef.current.mouse.y = y
    }

    function onLeave() {
      // push mouse offscreen so dots relax back
      stateRef.current.mouse.x = -9999
      stateRef.current.mouse.y = -9999
    }

    window.addEventListener('resize', resize, { passive: true })
    if (interactive) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseleave', onLeave)
      // also support touch as gentle fallbacks
      window.addEventListener('touchstart', (ev) => {
        const t = ev.touches?.[0]
        if (t) onMove(t)
      }, { passive: true })
      window.addEventListener('touchmove', (ev) => {
        const t = ev.touches?.[0]
        if (t) onMove(t)
      }, { passive: true })
      window.addEventListener('touchend', onLeave, { passive: true })
    }

    resize()

    // Animation loop: redraw all dots each frame. We keep computations minimal.
    function render() {
      const { dots, mouse } = stateRef.current
      const w = canvas.clientWidth
      const h = canvas.clientHeight

      ctx.clearRect(0, 0, w, h)

      // For each dot, compute displacement based on mouse distance
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        const dx = mouse.x - d.ox
        const dy = mouse.y - d.oy
        const dist = Math.sqrt(dx * dx + dy * dy)

        let ox = d.ox
        let oy = d.oy
        let scale = 1
        if (interactive && dist < maxInfluence) {
          const influence = 1 - (dist / maxInfluence)
          // ease influence (quadratic easing)
          const eased = influence * influence
          const push = eased * strength
          const nx = dx / (dist || 1)
          const ny = dy / (dist || 1)
          // repel: move away from cursor
          ox = d.ox - nx * push
          oy = d.oy - ny * push
          scale = 1 + eased * 0.7
        }

        ctx.beginPath()
        ctx.fillStyle = hexToRgba(dotColor, opacity * (scale > 1 ? Math.min(1, 0.6 + (scale - 1)) : 1))
        ctx.arc(ox, oy, dotSize * scale, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      if (interactive) {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseleave', onLeave)
      }
    }
  }, [enabled, dotSize, spacing, strength, dotColor, opacity, maxInfluence])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

// Utility: convert hex color to rgba with provided alpha
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}