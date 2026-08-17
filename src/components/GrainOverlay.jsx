import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

/* Port of initGrain() from portfolio-website-v2/js/main.js — same algorithm,
   unchanged: fine per-pixel grain everywhere, plus several drifting
   metaball-style "ink blotch" islands (summed smoothstep influences, not
   maxed, so nearby blobs bulge together and merge/split like liquid).
   The grain RGB/jitter buffers are generated ONCE and never re-randomized —
   only the blob positions move — since re-randomizing every frame is what
   reads as TV static.

   One React-specific difference from the vanilla version: this component
   mounts once at the app root and persists across client-side route
   changes (no full page reload), so the `.grain-safe-zone` element (only
   present on the case-study page) can appear/disappear as the user
   navigates. The vanilla version queried for it once at setup since every
   page load was a fresh document; here it's re-queried on every draw().

   Theme-aware blend mode: `multiply` only darkens, so against the dark
   theme's near-black background it has nothing left to darken and the
   grain becomes invisible. `screen` only lightens, which is what makes the
   same noise buffer read as flecks of light against black — the noise
   itself already spans the full 0-255 range, so no regeneration is needed
   when the theme switches, just the blend mode. */
export default function GrainOverlay() {
  const canvasRef = useRef(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    // Rendered at less than full resolution and stretched to fill via the
    // canvas's CSS box (fixed inset-0 handles that regardless of the
    // backing buffer's actual pixel size) — this is a full-viewport,
    // per-pixel JS loop running repeatedly, so cost scales with the square
    // of this value. Grain reads as fine texture either way, so the
    // softening from the downscale isn't noticeable.
    const scale = 0.65
    let w, h, blobs, grainRGB, grainAlphaJitter, imageData

    function makeBlobs() {
      const count = 6 + Math.floor(Math.random() * 3)
      const list = []
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 60 + Math.random() * 100
        list.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (90 + Math.random() * 260) * scale,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
      return list
    }

    let resizeRetryId = null
    function resize() {
      // window.innerWidth/innerHeight can briefly read 0 on the very first
      // tick of a mount, before the browser has finished layout — most
      // visible right at initial page load, since by the time a resize
      // EVENT fires later the viewport is always already sized. Calling
      // createImageData(0, h) throws IndexSizeError, so bail and retry
      // shortly instead of crashing the component.
      if (window.innerWidth === 0 || window.innerHeight === 0) {
        resizeRetryId = setTimeout(resize, 16)
        return
      }
      w = canvas.width = Math.ceil(window.innerWidth * scale)
      h = canvas.height = Math.ceil(window.innerHeight * scale)
      blobs = makeBlobs()
      const n = w * h
      grainRGB = new Uint8Array(n)
      grainAlphaJitter = new Float32Array(n)
      for (let p = 0; p < n; p++) {
        grainRGB[p] = Math.random() * 255
        grainAlphaJitter[p] = Math.random()
      }
      imageData = ctx.createImageData(w, h)
    }
    resize()
    window.addEventListener('resize', resize)

    const safeZoneMargin = 130
    let safeZoneRect = null

    function field(x, y) {
      let v = 0
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i]
        const dx = x - b.x, dy = y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        let influence = Math.max(0, 1 - dist / b.r)
        influence = influence * influence * (3 - 2 * influence)
        v += influence
      }
      v = Math.min(1, v)

      if (safeZoneRect) {
        let dxOut = 0, dyOut = 0
        if (x < safeZoneRect.left) dxOut = safeZoneRect.left - x
        else if (x > safeZoneRect.right) dxOut = x - safeZoneRect.right
        if (y < safeZoneRect.top) dyOut = safeZoneRect.top - y
        else if (y > safeZoneRect.bottom) dyOut = y - safeZoneRect.bottom
        const distOut = Math.sqrt(dxOut * dxOut + dyOut * dyOut)
        v *= Math.min(1, distOut / safeZoneMargin)
      }
      return v
    }

    const baseGrain = 16
    const blotchStrength = 230
    const fieldBlock = 6

    function draw() {
      const safeZoneEl = document.querySelector('.grain-safe-zone')
      safeZoneRect = safeZoneEl
        ? (() => {
            const r = safeZoneEl.getBoundingClientRect()
            return { left: r.left - 60, right: r.right + 60, top: r.top, bottom: r.bottom + 128 }
          })()
        : null

      const data = imageData.data
      for (let by = 0; by < h; by += fieldBlock) {
        const maxY = Math.min(by + fieldBlock, h)
        for (let bx = 0; bx < w; bx += fieldBlock) {
          const maxX = Math.min(bx + fieldBlock, w)
          const blotch = field(bx, by)
          const alphaRange = baseGrain + blotch * blotchStrength
          for (let y = by; y < maxY; y++) {
            const rowOffset = y * w
            for (let x = bx; x < maxX; x++) {
              const idx = rowOffset + x
              const i = idx * 4
              const v = grainRGB[idx]
              data[i] = v
              data[i + 1] = v
              data[i + 2] = v
              data[i + 3] = grainAlphaJitter[idx] * alphaRange
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0)
    }

    let lastTime = performance.now()
    function tick() {
      const now = performance.now()
      const dt = Math.min((now - lastTime) / 1000, 0.2)
      lastTime = now
      if (!document.hidden && imageData) {
        for (let i = 0; i < blobs.length; i++) {
          const b = blobs[i]
          b.x += b.vx * dt
          b.y += b.vy * dt
          if (b.x < -b.r) b.x = w + b.r
          if (b.x > w + b.r) b.x = -b.r
          if (b.y < -b.r) b.y = h + b.r
          if (b.y > h + b.r) b.y = -b.r
        }
        draw()
      }
    }
    tick()
    const intervalId = setInterval(tick, 140)

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(intervalId)
      if (resizeRetryId) clearTimeout(resizeRetryId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-[-1] w-full h-full pointer-events-none bg-fx-clip-sidebar ${
        theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'
      }`}
    />
  )
}
