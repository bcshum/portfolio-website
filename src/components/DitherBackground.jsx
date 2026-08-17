import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useTheme } from '../context/ThemeContext'

/* Port of Codrops' "Interactive WebGL Backgrounds: A Quick Guide to Bayer
   Dithering" (tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/,
   demo source: tympanus.net/Tutorials/BayerDithering). Shaders below are
   the reference's actual GLSL almost verbatim (pulled from its shipped
   bundle) — animated fbm noise thresholded through a recursive Bayer
   matrix (Bayer2 -> Bayer4 -> Bayer8) for an ordered-dither look, plus a
   ring-wave term per click that gets max'd into the same threshold so
   clicks ripple outward through the dither pattern. Only the uColor value
   and this component's mount/theme wiring are ours.

   Sits as its own full-screen layer alongside GrainOverlay (both mounted
   once at the app root) rather than merged into one canvas/algorithm —
   they're different rendering technologies (2D canvas pixel buffer vs.
   WebGL fragment shader) that don't share a natural single-pass
   combination, so "merging" them means layering: this renders at a lower
   z-index and low opacity, GrainOverlay keeps sitting in front of it as
   before, and the dither pattern's clicks feel like they're part of the
   same background rather than a separate thing on top of it. */
const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec3 uColor;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uPixelSize;

  const int MAX_CLICKS = 10;
  uniform vec2 uClickPos[MAX_CLICKS];
  uniform float uClickTimes[MAX_CLICKS];

  out vec4 fragColor;

  float Bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2. + a.y * a.y * .75);
  }
  #define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
  #define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

  #define FBM_OCTAVES 3
  #define FBM_LACUNARITY 1.25
  #define FBM_GAIN 1.
  #define FBM_SCALE 4.0

  float hash11(float n) { return fract(sin(n) * 43758.5453); }

  float vnoise(vec3 p) {
    vec3 ip = floor(p);
    vec3 fp = fract(p);

    float n000 = hash11(dot(ip + vec3(0.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
    float n100 = hash11(dot(ip + vec3(1.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
    float n010 = hash11(dot(ip + vec3(0.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
    float n110 = hash11(dot(ip + vec3(1.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
    float n001 = hash11(dot(ip + vec3(0.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
    float n101 = hash11(dot(ip + vec3(1.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
    float n011 = hash11(dot(ip + vec3(0.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
    float n111 = hash11(dot(ip + vec3(1.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));

    vec3 w = fp * fp * fp * (fp * (fp * 6.0 - 15.0) + 10.0);

    float x00 = mix(n000, n100, w.x);
    float x10 = mix(n010, n110, w.x);
    float x01 = mix(n001, n101, w.x);
    float x11 = mix(n011, n111, w.x);

    float y0 = mix(x00, x10, w.y);
    float y1 = mix(x01, x11, w.y);

    return mix(y0, y1, w.z) * 2.0 - 1.0;
  }

  float fbm2(vec2 uv, float t) {
    vec3 p = vec3(uv * FBM_SCALE, t);
    float amp = 1.;
    float freq = 1.;
    float sum = 1.;

    for (int i = 0; i < FBM_OCTAVES; ++i) {
      sum += amp * vnoise(p * freq);
      freq *= FBM_LACUNARITY;
      amp *= FBM_GAIN;
    }

    return sum * 0.5 + 0.5;
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
    float aspectRatio = uResolution.x / uResolution.y;

    /* Ambient texture: fine dither grid, driven by fbm noise only. */
    float cellPixelSize = 8. * uPixelSize;
    vec2 cellId = floor(fragCoord / cellPixelSize);
    vec2 cellCoord = cellId * cellPixelSize;
    vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

    float feed = fbm2(uv, uTime * 0.0125);
    feed = feed * 0.5 - 0.65;

    float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
    float bwAmbient = step(0.5, feed + bayer);

    /* Click ripples: computed per-pixel (not snapped to a dither grid like
       the ambient texture). A regular Bayer grid reads as "pixels"; a
       smooth alpha gradient reads as a flat glow with no texture at all.
       What actually looks like ink/grain is a RANDOM per-pixel dither —
       covered pixels are fully opaque (real texture, not a fade), but
       which pixels are covered is irregular rather than snapped to a
       grid, and the coverage density itself follows the ring/falloff. */
    vec2 rippleUv = fragCoord / uResolution * vec2(aspectRatio, 1.0);

    const float speed = 0.30;
    const float thickness = 0.10;
    const float dampT = 1.0;
    const float dampR = 10.0;

    float rippleFeed = 0.0;
    for (int i = 0; i < MAX_CLICKS; ++i) {
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;

      vec2 cuv = ((pos - uResolution * .5) / uResolution) * vec2(aspectRatio, 1.0);

      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(rippleUv, cuv);

      float waveR = speed * t;
      float ring = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      rippleFeed = max(rippleFeed, ring * atten);
    }

    float ditherNoise = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
    float bwRipple = step(1.0 - clamp(rippleFeed, 0.0, 1.0), ditherNoise);

    float bw = max(bwAmbient, bwRipple);
    fragColor = vec4(uColor, bw);
  }
`

const MAX_CLICKS = 10
const PIXEL_SIZE = 1

// Shader output is fully opaque or fully transparent (no in-between
// greys), so opacity here directly scales even "fully lit" dots down
// toward the background color — 0.45 was reading as dim grey rather than
// bright white against the dark theme's near-black background.
const OPACITY = { light: 0.9, dark: 0.9 }

// Full-screen fbm noise is the expensive part of this shader (every
// fragment evaluates several octaves of 3D value noise); this is a
// full-viewport effect running every frame, so cost scales directly with
// pixel count. Rendering the WebGL buffer smaller than the CSS box (the
// GPU upscales it automatically) and capping the frame rate both cut GPU
// load substantially with the dither's already-blocky look hiding most of
// the softness from the downscale.
const RENDER_SCALE = 0.6
const TARGET_FPS = 15

export default function DitherBackground() {
  const hostRef = useRef(null)
  const { theme } = useTheme()

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer, scene, camera, material
    let rafId
    let slot = 0

    function currentColor() {
      // Black ink on the light theme, white on dark — same contrast logic
      // GrainOverlay already uses (multiply-blended dark grain vs.
      // screen-blended light flecks), so the two layers read as one
      // consistent texture instead of two different effects.
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      return new THREE.Color(isDark ? '#FFFFFF' : '#000000')
    }

    try {
      // No antialiasing: the shader's output is already a hard-edged
      // step() dither, so MSAA has nothing meaningful to smooth — just
      // wasted GPU work.
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
      host.appendChild(renderer.domElement)
      Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })

      scene = new THREE.Scene()
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        glslVersion: THREE.GLSL3,
        transparent: true,
        uniforms: {
          uColor: { value: currentColor() },
          uResolution: { value: new THREE.Vector2() },
          uTime: { value: 0 },
          uPixelSize: { value: PIXEL_SIZE },
          uClickPos: { value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)) },
          uClickTimes: { value: new Float32Array(MAX_CLICKS) },
        },
      })
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

      function resize() {
        // Deliberately left at the renderer's default 1:1 pixel ratio (no
        // devicePixelRatio scaling) — the reference does the same, since
        // gl_FragCoord and uResolution both need to stay in the same
        // space; scaling one without the other would make the dither grid
        // render at half its intended on-screen size on retina displays.
        const w = Math.round(window.innerWidth * RENDER_SCALE)
        const h = Math.round(window.innerHeight * RENDER_SCALE)
        renderer.setSize(w, h, false)
        material.uniforms.uResolution.value.set(w, h)
      }
      resize()
      window.addEventListener('resize', resize)

      function handlePointerDown(e) {
        const rect = renderer.domElement.getBoundingClientRect()
        const x = (e.clientX - rect.left) * (renderer.domElement.width / rect.width)
        const y = (rect.height - (e.clientY - rect.top)) * (renderer.domElement.height / rect.height)
        material.uniforms.uClickPos.value[slot].set(x, y)
        material.uniforms.uClickTimes.value[slot] = material.uniforms.uTime.value
        slot = (slot + 1) % MAX_CLICKS
      }
      window.addEventListener('pointerdown', handlePointerDown)

      const clock = new THREE.Clock()
      const frameInterval = 1 / TARGET_FPS
      let lastRender = 0
      function tick() {
        rafId = requestAnimationFrame(tick)
        const now = clock.getElapsedTime()
        if (document.hidden || now - lastRender < frameInterval) return
        lastRender = now

        material.uniforms.uTime.value = now
        material.uniforms.uColor.value = currentColor()
        renderer.render(scene, camera)
      }
      rafId = requestAnimationFrame(tick)

      return () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', resize)
        window.removeEventListener('pointerdown', handlePointerDown)
        renderer.dispose()
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    } catch (err) {
      console.error('DitherBackground: WebGL setup failed, skipping', err)
    }
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      // Same blend-mode logic as GrainOverlay: plain alpha compositing
      // makes white dots over a near-black page look dim/grey no matter
      // how high the opacity goes (opacity is a straight lerp toward the
      // background color) — `screen` actually brightens instead, which is
      // what makes white read as bright white against dark. `multiply`
      // does the equivalent for black against the light background.
      className={`fixed inset-0 z-[-2] pointer-events-none bg-fx-clip-sidebar ${
        theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'
      }`}
      style={{ opacity: theme === 'dark' ? OPACITY.dark : OPACITY.light }}
    />
  )
}
