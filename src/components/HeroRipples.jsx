import { useEffect, useRef } from 'react'

/* Port of initHeroRipples() from portfolio-website-v2/js/main.js.
   Unlike the vanilla version (which looked up a single page-wide
   `#heroCanvas` by id), this owns its own canvas ref directly — it's
   meant to be rendered inside the Home hero section itself, so there's
   no global lookup needed and no id collision risk if the page ever
   renders more than one instance.

   Stroke color reads the live --accent CSS variable each frame (instead
   of a hardcoded rust rgb()) so the ripples switch from rust to gold along
   with the rest of the site when the theme toggles — cheap enough to read
   every tick since it's a single computed-style lookup, not per-ripple. */
export default function HeroRipples({ className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let ripples = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize(width, height) {
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    let resizeObserver
    let onWindowResize
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver((entries) => {
        const box = entries[0].contentRect
        resize(box.width, box.height)
      })
      resizeObserver.observe(canvas)
    } else {
      resize(canvas.offsetWidth, canvas.offsetHeight)
      onWindowResize = () => resize(canvas.offsetWidth, canvas.offsetHeight)
      window.addEventListener('resize', onWindowResize)
    }

    function addRipple(x, y, alpha) {
      ripples.push({ x, y, r: 0, alpha: alpha || 0.6 })
    }

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect()
      addRipple(e.clientX - rect.left, e.clientY - rect.top)
    }
    canvas.addEventListener('pointerdown', onPointerDown)

    let raindropTimer
    function scheduleRaindrop() {
      const delay = 930 + Math.random() * 1730
      raindropTimer = setTimeout(() => {
        if (!document.hidden) {
          addRipple(Math.random() * canvas.offsetWidth, Math.random() * canvas.offsetHeight)
        }
        scheduleRaindrop()
      }, delay)
    }
    scheduleRaindrop()

    function onVisibilityChange() {
      if (document.hidden) ripples = []
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    let rafId
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ripples.forEach((r) => {
        r.r += 1.1
        r.alpha *= 0.97
      })
      ripples = ripples.filter((r) => r.alpha > 0.012)
      if (ripples.length) {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
        ripples.forEach((r) => {
          ctx.beginPath()
          ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
          ctx.strokeStyle = accent
          ctx.globalAlpha = r.alpha
          ctx.lineWidth = 1.8
          ctx.stroke()
        })
        ctx.globalAlpha = 1
      }
      rafId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      if (onWindowResize) window.removeEventListener('resize', onWindowResize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearTimeout(raindropTimer)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
