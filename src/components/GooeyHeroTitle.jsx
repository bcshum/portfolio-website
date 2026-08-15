import { useEffect, useRef } from 'react'
import { animate } from 'motion'

/* Ports the SVG filter recipe from Codrops' "Gooey Text Hover Effect"
   (feGaussianBlur -> feColorMatrix contrast boost -> feComposite atop —
   the classic metaball/gooey-blend trick: blur softens/merges nearby
   letterforms, then the color matrix snaps that soft blur back to hard
   opaque/transparent based on an alpha threshold, so overlapping ink
   fuses into one blobby mass instead of just looking blurred).

   The reference crossfades TWO words into each other on hover, animating
   blur up then back down across the swap. Adapted here for a one-time
   page-load reveal of a SINGLE word instead: blur starts high (reading as
   a blobby, half-formed mass) and animates down to 0, so "Bryan Shum"
   genuinely resolves/condenses out of goo rather than crossfading from
   another string. Runs via Motion's imperative animate() (not the
   declarative `animate` prop) since what's being tweened is a raw SVG
   filter primitive attribute, not a CSS/style property React can drive
   directly — the DOM query targets the shared #gooey-title filter defined
   once in SvgFilters.jsx. */
const PEAK_BLUR = 40
const DURATION = 0.9

export default function GooeyHeroTitle({ text, as: Tag = 'h1', className }) {
  const elRef = useRef(null)

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
        duration: DURATION,
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

  return (
    <Tag ref={elRef} className={className}>
      {text}
    </Tag>
  )
}
