import { useEffect, useRef } from 'react'

/* Port of initLiquidCursor() from portfolio-website-v2/js/main.js — the
   Catmull-Rom-spline tapered polygon cursor (verified extensively there:
   the spline genuinely curves ahead of sharp turns rather than joining
   straight segments, and the head/tail caps sweep proper arcs).

   One React-specific change: the vanilla version bound hover listeners to
   each `a, button, .btn, [data-cursor-hover]` element once at setup and
   tracked which ones it had already bound via a dataset flag. That doesn't
   work here — this component persists across client-side route changes,
   so the set of interactive elements on the page changes as you navigate,
   and elements from an unmounted page would still be holding listeners.
   Switched to event delegation (one mouseover/mouseout pair on
   `document`, checking `closest()` at event time) instead, which is
   correct regardless of what's currently mounted. */
export default function LiquidCursor() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    document.documentElement.classList.add('has-custom-cursor')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const baseRadius = 25
    let scaleFactor = 1
    const maxAge = 260
    const rawSpacing = 40
    const samplesPerSegment = 8
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let raw = [{ x: mouseX, y: mouseY, born: performance.now() }]

    function onPointerMove(e) {
      const now = performance.now()
      const last = raw[raw.length - 1]
      const dx = e.clientX - last.x, dy = e.clientY - last.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const steps = Math.max(1, Math.min(15, Math.round(dist / rawSpacing)))
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        raw.push({ x: last.x + dx * t, y: last.y + dy * t, born: now })
      }
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener('pointermove', onPointerMove)

    function isHoverable(el) {
      return el && el.closest && el.closest('a, button, .btn, [data-cursor-hover]')
    }
    function onMouseOver(e) {
      if (isHoverable(e.target)) scaleFactor = 1.4
    }
    function onMouseOut(e) {
      if (isHoverable(e.target) && !isHoverable(e.relatedTarget)) scaleFactor = 1
    }
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)

    function catmullRomPoint(p0, p1, p2, p3, t) {
      const t2 = t * t, t3 = t2 * t
      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        born: p1.born + (p2.born - p1.born) * t,
      }
    }

    function buildSplinePoints(rawPts, perSegment) {
      const n = rawPts.length
      if (n < 2) return rawPts.slice()
      const out = []
      for (let i = 0; i < n - 1; i++) {
        const p0 = rawPts[Math.max(0, i - 1)]
        const p1 = rawPts[i]
        const p2 = rawPts[i + 1]
        const p3 = rawPts[Math.min(n - 1, i + 2)]
        for (let s = 0; s < perSegment; s++) {
          out.push(catmullRomPoint(p0, p1, p2, p3, s / perSegment))
        }
      }
      out.push(rawPts[n - 1])
      return out
    }

    function tracePath(pts, continuing) {
      const n = pts.length
      if (continuing) ctx.lineTo(pts[0].x, pts[0].y)
      else ctx.moveTo(pts[0].x, pts[0].y)
      if (n < 2) return
      for (let i = 1; i < n - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2
        const midY = (pts[i].y + pts[i + 1].y) / 2
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
      }
      const last = pts[n - 1], prev = pts[Math.max(0, n - 2)]
      ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y)
    }

    let rafId
    function tick() {
      const now = performance.now()
      while (raw.length > 1 && now - raw[0].born > maxAge) raw.shift()

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#fff'

      if (raw.length < 2) {
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, baseRadius * scaleFactor, 0, Math.PI * 2)
        ctx.fill()
        rafId = requestAnimationFrame(tick)
        return
      }

      const pts = buildSplinePoints(raw, samplesPerSegment)
      const n = pts.length
      const left = [], right = [], halfWidths = []
      for (let i = 0; i < n; i++) {
        const p = pts[i]
        const prev = pts[Math.max(0, i - 1)]
        const next = pts[Math.min(n - 1, i + 1)]
        let tx = next.x - prev.x, ty = next.y - prev.y
        const tlen = Math.sqrt(tx * tx + ty * ty) || 1
        tx /= tlen
        ty /= tlen
        const px = -ty, py = tx

        const ageParam = Math.min(1, (now - p.born) / maxAge)
        const widthFactor = Math.max(0.12, Math.pow(1 - ageParam, 0.6))
        const hw = baseRadius * scaleFactor * widthFactor
        halfWidths.push(hw)

        left.push({ x: p.x + px * hw, y: p.y + py * hw })
        right.push({ x: p.x - px * hw, y: p.y - py * hw })
      }

      ctx.beginPath()
      tracePath(left, false)

      const headP = pts[n - 1], headPrev = pts[n - 2]
      const hdx = headP.x - headPrev.x, hdy = headP.y - headPrev.y
      const hlen = Math.sqrt(hdx * hdx + hdy * hdy) || 1
      const headAngle = Math.atan2(hdy / hlen, hdx / hlen)
      const angleLeft = headAngle + Math.PI / 2
      const angleRight = headAngle - Math.PI / 2
      const headHw = halfWidths[n - 1]
      const capSteps = 10
      for (let s = 1; s <= capSteps; s++) {
        const ang = angleLeft + (s / capSteps) * (angleRight - angleLeft)
        ctx.lineTo(headP.x + headHw * Math.cos(ang), headP.y + headHw * Math.sin(ang))
      }

      tracePath(right.slice().reverse(), true)

      const tailP = pts[0], tailNext = pts[1]
      const tdx = tailP.x - tailNext.x, tdy = tailP.y - tailNext.y
      const tlen2 = Math.sqrt(tdx * tdx + tdy * tdy) || 1
      const tailAngle = Math.atan2(tdy / tlen2, tdx / tlen2)
      const tAngleRight = tailAngle + Math.PI / 2
      const tAngleLeft = tailAngle - Math.PI / 2
      const tailHw = halfWidths[0]
      for (let s = 1; s <= capSteps; s++) {
        const ang = tAngleRight + (s / capSteps) * (tAngleLeft - tAngleRight)
        ctx.lineTo(tailP.x + tailHw * Math.cos(ang), tailP.y + tailHw * Math.sin(ang))
      }

      ctx.closePath()
      ctx.fill()

      rafId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      cancelAnimationFrame(rafId)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none mix-blend-difference"
    />
  )
}
