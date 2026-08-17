import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import * as THREE from 'three'

/* Ports the SVG filter recipe from Codrops' "Gooey Text Hover Effect"
   (feGaussianBlur -> feColorMatrix contrast boost -> feComposite atop —
   the classic metaball/gooey-blend trick: blur softens/merges nearby
   letterforms, then the color matrix snaps that soft blur back to hard
   opaque/transparent based on an alpha threshold, so overlapping ink
   fuses into one blobby mass instead of just looking blurred).

   The reference's actual mechanic is a hover-triggered crossfade between
   TWO words, blurring up then back down across the swap. This component
   uses that same crossfade for its recurring English/Chinese cycle below,
   but ALSO needs a one-time page-load reveal for the very first paint
   (blur starts high and settles to 0, so "Bryan Shum" genuinely resolves
   out of goo on mount) — that's this first effect, separate from the
   cycle. Runs via Motion's imperative animate() (not the declarative
   `animate` prop) since what's being tweened is a raw SVG filter
   primitive attribute, not a CSS/style property React can drive directly
   — the DOM query targets the shared #gooey-title filter defined once in
   SvgFilters.jsx. */
const PEAK_BLUR = 40
const REVEAL_DURATION = 0.9

/* Recurring morph between the English and Chinese names: hold one name for
   HOLD_DURATION, then blur up / swap text at the peak / blur back down
   (two chained animate() calls rather than a single [0, peak, 0] keyframe
   tween, since the text swap needs to happen at an exact instant — the
   peak — not track a continuous progress value). */
const HOLD_DURATION = 5000
const MORPH_PEAK_BLUR = 30
const MORPH_HALF_DURATION = 0.6

/* Port of Codrops' "Mouse Flowmap Deformation with OGL"
   (tympanus.net/Development/FlowmapDeformation) — pulled the actual demo
   source (its inline <script type="module"> block, not the minified OGL
   bundle) rather than guessing. Their technique: a persistent velocity
   texture ("flowmap") is updated every frame — it decays (uDissipation)
   and gets a new "stamp" of the current mouse velocity within a falloff
   radius wherever the cursor is — then the displayed content samples that
   flowmap and offsets its own UV lookup by the stored velocity vector,
   which is what makes it look like the cursor is dragging/melting the
   surface rather than just distorting a static radius around it. Ported
   here with Three.js (already a dependency) instead of adding the `ogl`
   package, using two ping-pong WebGLRenderTargets for the flow texture in
   place of OGL's built-in Flowmap class — same math, same defaults
   (falloff 0.3, alpha 1, dissipation 0.96, per OGL's Flowmap constructor).

   Distorts a TEXT ALPHA MASK rather than their water photo.

   The WebGL canvas is the PERMANENT visible layer once it's ready — not
   swapped in only during hover. An earlier version crossfaded between the
   real DOM text (idle) and this canvas (hover), but canvas-rendered text
   and DOM-rendered text are never guaranteed pixel-identical (different
   rasterizers/hinting/sub-pixel positioning), so every crossfade showed a
   brief, visible seam between the two no matter how precisely the
   position was measured. Removing the swap removes the seam entirely:
   when idle, flow is zero, so the shader samples the text texture
   undistorted — same single rendering, always, whether hovering or not.
   Given how many times a hero-text WebGL effect has broken visibility
   this session, the DOM text still isn't removed casually — it's only
   hidden once WebGL has confirmed it initialized successfully (`flowReady`),
   and only once, at mount; a setup failure just leaves the plain DOM text
   visible forever, never a blank title. */
const FLOW_SIZE = 256
// Falloff/dissipation now match the reference's demo 3 ("Alienation") config
// rather than demo 1's — tighter stamp radius (0.5 * 0.2 vs demo 1's 0.5 *
// 0.3) and faster decay (0.9 vs 0.96) makes the trail feel snappier and
// more concentrated around the cursor instead of smeared, which combined
// with a much larger distort strength (demo 3's own coefficient is
// actually slightly lower than demo 1's — the "more dramatic" feel there
// comes from that snappiness, not raw strength) is what actually delivers
// "more distortion on interaction" rather than just a bigger blur radius.
const FLOW_FALLOFF = 0.1 // 0.5 * demo 3's falloff: 0.2
const FLOW_ALPHA = 1
const FLOW_DISSIPATION = 0.9
const FLOW_DISTORT_STRENGTH = 0.4
const FLOW_PADDING = 40 // px around the text box, so distortion isn't clipped at the edges

const FLOW_UPDATE_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`
// This is OGL's actual flowmap update fragment shader, unchanged.
const FLOW_UPDATE_FRAGMENT = `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uFalloff;
  uniform float uAlpha;
  uniform float uDissipation;
  uniform float uAspect;
  uniform vec2 uMouse;
  uniform vec2 uVelocity;
  varying vec2 vUv;
  void main() {
    vec2 cursor = vUv - uMouse;
    vec4 color = texture2D(tMap, vUv) * uDissipation;
    cursor.x *= uAspect;
    vec3 stamp = vec3(uVelocity * vec2(1.0, -1.0), 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
    float falloff = smoothstep(uFalloff, 0.0, length(cursor)) * uAlpha;
    color.rgb = mix(color.rgb, stamp, vec3(falloff));
    gl_FragColor = color;
  }
`
const DISPLAY_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`
const DISPLAY_FRAGMENT = `
  precision highp float;
  uniform sampler2D tFlow;
  uniform sampler2D tText;
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    vec3 flow = texture2D(tFlow, vUv).rgb;
    vec2 uv = vUv - flow.xy * uStrength;
    float a = texture2D(tText, uv).a;
    gl_FragColor = vec4(uColor, a);
  }
`

function buildTextMaskTexture(el, text, widthPx, heightPx, pad, dpr) {
  const width = widthPx + pad * 2
  const height = heightPx + pad * 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const style = getComputedStyle(el)
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  // Canvas text defaults to zero extra tracking — .hero-title has
  // letter-spacing: 0.005em, which is tiny per-character but compounds
  // across a whole word at this font's huge size (up to 9rem). Left
  // unset, that drift is exactly what read as the text "shifting":
  // aligned at the first letter, increasingly offset by the last one.
  if ('letterSpacing' in ctx) ctx.letterSpacing = style.letterSpacing
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Where the DOM's own baseline actually sits within the line box,
  // measured with real CSS layout rather than predicted: a zero-size
  // inline-block with vertical-align:baseline has its own edge aligned
  // exactly to the text's baseline by definition — inserted and removed
  // synchronously, so React never sees this DOM tweak. (A Range-based
  // "tight ink box" measurement was tried first but turned out to just
  // return the same box as the full line height on this element — not a
  // safe technique for vertical baseline position specifically.)
  const marker = document.createElement('span')
  marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;'
  el.appendChild(marker)
  const domBaselineOffset = marker.getBoundingClientRect().top - el.getBoundingClientRect().top
  el.removeChild(marker)

  ctx.fillText(text, pad, pad + domBaselineOffset)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

export default function GooeyHeroTitle({ text, altText, as: Tag = 'h1', className }) {
  const elRef = useRef(null)
  const textSpanRef = useRef(null)
  const canvasHostRef = useRef(null)
  const [nameIndex, setNameIndex] = useState(0)
  const [flowReady, setFlowReady] = useState(false)
  const names = altText ? [text, altText] : [text]
  const displayedText = names[nameIndex % names.length]

  useEffect(() => {
    const el = elRef.current
    const feBlur = document.querySelector('#gooey-title feGaussianBlur')
    if (!el || !feBlur) return

    el.style.filter = 'url(#gooey-title)'
    const controls = { stdDeviation: PEAK_BLUR }
    const anim = animate(
      controls,
      { stdDeviation: 0 },
      {
        duration: REVEAL_DURATION,
        ease: 'easeOut',
        onUpdate: () => feBlur.setAttribute('stdDeviation', controls.stdDeviation),
        onComplete: () => {
          el.style.filter = 'none'
        },
      }
    )

    return () => {
      anim.stop()
      el.style.filter = 'none'
    }
  }, [])

  useEffect(() => {
    if (!altText) return
    const el = elRef.current
    const feBlur = document.querySelector('#gooey-title feGaussianBlur')
    if (!el || !feBlur) return

    let cancelled = false
    let anim

    function morphToNext() {
      el.style.filter = 'url(#gooey-title)'
      const controls = { stdDeviation: 0 }
      anim = animate(controls, { stdDeviation: MORPH_PEAK_BLUR }, {
        duration: MORPH_HALF_DURATION,
        ease: 'easeIn',
        onUpdate: () => feBlur.setAttribute('stdDeviation', controls.stdDeviation),
        onComplete: () => {
          if (cancelled) return
          setNameIndex((i) => i + 1)
          anim = animate(controls, { stdDeviation: 0 }, {
            duration: MORPH_HALF_DURATION,
            ease: 'easeOut',
            onUpdate: () => feBlur.setAttribute('stdDeviation', controls.stdDeviation),
            onComplete: () => {
              if (!cancelled) el.style.filter = 'none'
            },
          })
        },
      })
    }

    const intervalId = setInterval(morphToNext, HOLD_DURATION)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      anim?.stop()
    }
  }, [altText])

  // Flowmap hover-distortion: rebuilt whenever the displayed text changes
  // (including the English/Chinese cycle above) so the alpha mask always
  // matches what's actually on screen.
  useEffect(() => {
    const textSpan = textSpanRef.current
    const host = canvasHostRef.current
    if (!textSpan || !host) return

    let renderer, scene, camera
    let flowMaterial, displayMaterial
    let targetA, targetB
    let textTexture
    let rafId
    let handleMove, handleLeave, handleResize
    let destroyed = false

    const mouse = { x: -1, y: -1 }
    const velocity = { x: 0, y: 0 }
    const lastMouse = { x: 0, y: 0 }
    let lastTime = null
    let isOverTitle = false

    function currentColor() {
      // Read from elRef (the <h1>), not textSpan — once flowReady flips,
      // textSpan's own inline style is deliberately forced to
      // color: transparent (see JSX below) so only the WebGL canvas shows.
      // Reading textSpan's computed color at that point returns the
      // transparent value itself (rgba(0,0,0,0) -> [0,0,0]), i.e. always
      // black, regardless of theme — which is why the canvas text rendered
      // black-on-black in dark mode. elRef never has that override, so its
      // computed color always reflects the real (theme-aware) ink color.
      const c = getComputedStyle(elRef.current).color
      const m = c.match(/[\d.]+/g)
      return m ? [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255] : [0, 0, 0]
    }

    async function setup() {
      await document.fonts.ready
      await new Promise(requestAnimationFrame) // let a post-theme-change style recalc land, same fix as the dither background needed
      if (destroyed) return

      const rect = textSpan.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = rect.width + FLOW_PADDING * 2
      const height = rect.height + FLOW_PADDING * 2

      // The canvas host's positioned ancestor is elRef (the <h1>, via its
      // own position:relative), NOT textSpan itself — so its offset has to
      // be measured against elRef's box, not assumed to be flush with it.
      // That assumption was the actual bug: the text doesn't necessarily
      // start at the h1's own top-left corner (line-height leading on a
      // huge clamp()-sized font adds vertical space above the glyphs, and
      // the sr-only span before it in the DOM can shift things further),
      // so a hardcoded -FLOW_PADDING offset landed the canvas a few pixels
      // off from the real text — invisible at rest (canvas hidden), but
      // obvious as a "second, shifted word" during the hover crossfade.
      const elRect = elRef.current.getBoundingClientRect()
      const offsetLeft = rect.left - elRect.left - FLOW_PADDING
      const offsetTop = rect.top - elRect.top - FLOW_PADDING

      textTexture = buildTextMaskTexture(textSpan, displayedText, rect.width, rect.height, FLOW_PADDING, dpr)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(width, height, false)
      Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
      host.appendChild(renderer.domElement)
      Object.assign(host.style, {
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
        width: `${width}px`,
        height: `${height}px`,
      })

      scene = new THREE.Scene()
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      const rtOptions = { type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false }
      targetA = new THREE.WebGLRenderTarget(FLOW_SIZE, FLOW_SIZE, rtOptions)
      targetB = new THREE.WebGLRenderTarget(FLOW_SIZE, FLOW_SIZE, rtOptions)

      flowMaterial = new THREE.ShaderMaterial({
        vertexShader: FLOW_UPDATE_VERTEX,
        fragmentShader: FLOW_UPDATE_FRAGMENT,
        uniforms: {
          tMap: { value: null },
          uFalloff: { value: FLOW_FALLOFF },
          uAlpha: { value: FLOW_ALPHA },
          uDissipation: { value: FLOW_DISSIPATION },
          uAspect: { value: width / height },
          uMouse: { value: new THREE.Vector2(-1, -1) },
          uVelocity: { value: new THREE.Vector2(0, 0) },
        },
        depthTest: false,
        depthWrite: false,
      })
      const flowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flowMaterial)
      const flowScene = new THREE.Scene()
      flowScene.add(flowMesh)

      displayMaterial = new THREE.ShaderMaterial({
        vertexShader: DISPLAY_VERTEX,
        fragmentShader: DISPLAY_FRAGMENT,
        transparent: true,
        uniforms: {
          tFlow: { value: null },
          tText: { value: textTexture },
          uColor: { value: new THREE.Color(...currentColor()) },
          uStrength: { value: FLOW_DISTORT_STRENGTH },
        },
      })
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), displayMaterial))

      handleMove = (e) => {
        const r = textSpan.getBoundingClientRect()
        isOverTitle = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        const x = (e.clientX - r.left) / r.width
        const y = 1 - (e.clientY - r.top) / r.height

        const now = performance.now()
        if (lastTime !== null && isOverTitle) {
          const dt = Math.max(10.4, now - lastTime)
          velocity.x = (e.clientX - lastMouse.x) / dt
          velocity.y = (e.clientY - lastMouse.y) / dt
        }
        lastMouse.x = e.clientX
        lastMouse.y = e.clientY
        lastTime = now

        if (isOverTitle) {
          mouse.x = x
          mouse.y = y
        }
      }
      window.addEventListener('pointermove', handleMove)

      handleLeave = () => {
        isOverTitle = false
      }
      window.addEventListener('pointerleave', handleLeave)

      // The hero title's font-size is responsive (clamp()), so its actual
      // rendered box can change on resize — reposition (and rebuild the
      // texture, since the text's own pixel dimensions can change too)
      // rather than leaving a stale, now-misaligned canvas in place.
      handleResize = () => {
        const r = textSpan.getBoundingClientRect()
        const eR = elRef.current.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return
        const w = r.width + FLOW_PADDING * 2
        const h = r.height + FLOW_PADDING * 2
        Object.assign(host.style, {
          left: `${r.left - eR.left - FLOW_PADDING}px`,
          top: `${r.top - eR.top - FLOW_PADDING}px`,
          width: `${w}px`,
          height: `${h}px`,
        })
        renderer.setSize(w, h, false)
        textTexture.dispose()
        textTexture = buildTextMaskTexture(textSpan, displayedText, r.width, r.height, FLOW_PADDING, dpr)
        displayMaterial.uniforms.tText.value = textTexture
      }
      window.addEventListener('resize', handleResize)

      function tick() {
        rafId = requestAnimationFrame(tick)
        if (document.hidden) return

        if (!isOverTitle) {
          mouse.x = -1
          mouse.y = -1
          velocity.x = 0
          velocity.y = 0
        }

        flowMaterial.uniforms.tMap.value = targetA.texture
        flowMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y)
        flowMaterial.uniforms.uVelocity.value.lerp(new THREE.Vector2(velocity.x, velocity.y), isOverTitle ? 0.15 : 0.1)
        renderer.setRenderTarget(targetB)
        renderer.render(flowScene, camera)
        renderer.setRenderTarget(null)
        ;[targetA, targetB] = [targetB, targetA]

        displayMaterial.uniforms.tFlow.value = targetA.texture
        displayMaterial.uniforms.uColor.value.setRGB(...currentColor())
        renderer.render(scene, camera)
      }
      rafId = requestAnimationFrame(tick)

      setFlowReady(true)
    }

    setup().catch((err) => {
      console.error('GooeyHeroTitle: flowmap setup failed, skipping the hover effect', err)
    })

    return () => {
      destroyed = true
      setFlowReady(false)
      cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerleave', handleLeave)
      window.removeEventListener('resize', handleResize)
      textTexture?.dispose()
      targetA?.dispose()
      targetB?.dispose()
      renderer?.dispose()
      if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [displayedText])

  return (
    <Tag ref={elRef} className={className} style={{ position: 'relative' }}>
      <span className="sr-only">{text}</span>
      <span
        ref={textSpanRef}
        aria-hidden="true"
        style={{ position: 'relative', color: flowReady ? 'transparent' : undefined, transition: 'color 0.3s ease' }}
      >
        {displayedText}
      </span>
      <span
        ref={canvasHostRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          opacity: flowReady ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </Tag>
  )
}
