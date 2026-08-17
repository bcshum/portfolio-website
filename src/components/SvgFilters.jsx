/* Global SVG filters mounted once at the app root. These predate the
   goo-title experiment and are kept so any existing decorative ink usage
   elsewhere in the site continues to work exactly as before. */
export default function SvgFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="ink-bleed" x="-60%" y="-60%" width="220%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.15 0.3" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="1.1" />
        </filter>
        <filter id="ink-bleed-text" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="0.9" />
        </filter>
        <filter id="gooey-title" x="-75%" y="-120%" width="250%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.2" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 46 -16
            "
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        {/* Port of Codrops' "Liquid Distortion Effects" demo 5
            (tympanus.net/Development/LiquidDistortion/index5.html) — its
            real mechanic (pulled from the actual main5.js source) is a
            PixiJS DisplacementFilter driven by a cloud-noise texture,
            scaled dramatically up on pointerdown and back down on
            pointerup via GSAP. Same shape here, ported to the SVG filter
            family already used elsewhere on this site (ink-bleed, the goo
            title) instead of adding PixiJS: feTurbulence generates the
            organic noise procedurally (no clouds.jpg asset needed), and
            feDisplacementMap's scale is animated 0 -> large -> 0 by
            HeroLiquidDistortion.jsx on press/release. Region is generous
            (-20%/140%) since the whole hero section — not just a small
            element — needs room to warp without clipping at its edges. */}
        <filter id="hero-liquid-distortion" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.01" numOctaves="3" seed="12" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Same ink-bleed recipe as above, re-tuned for the hero sun disc:
            that filter's displacement scale (6) was calibrated for small
            text glyphs, so applied to a ~200px circle it barely dents the
            edge. Bigger scale + lower baseFrequency (coarser, larger-radius
            noise) so the wobble reads at the disc's actual size — an
            uneven, hand-inked circle instead of a precise vector one. */}
        <filter id="hero-sun-ink" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="3" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="1.6" />
        </filter>
      </defs>
    </svg>
  )
}



