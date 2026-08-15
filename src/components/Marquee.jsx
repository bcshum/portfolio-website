import { Fragment, useEffect, useRef } from 'react'

const WORDS = ['UX Research', 'Interaction Design', 'Prototyping', 'Visual Design']

/* Port of initMarquee() from main.js. Duplicates the base unit until the
   track overflows the container, then doubles whatever it ended up with so
   the translateX(-50%) loop never runs out of content, and sets the
   animation duration from the resulting width so scroll speed (px/s) stays
   constant regardless of viewport width. Done with direct DOM manipulation
   via refs (cloneNode, appendChild) rather than React state, matching the
   original technique — this is a one-time layout measurement + imperative
   build, not something that benefits from re-rendering. */
export default function Marquee() {
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const baseUnitRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    const baseUnit = baseUnitRef.current
    if (!container || !track || !baseUnit) return

    let resizeTimer

    function build() {
      track.style.animation = 'none'
      track.innerHTML = ''
      track.appendChild(baseUnit)
      const containerWidth = container.offsetWidth
      while (track.scrollWidth < containerWidth) {
        track.appendChild(baseUnit.cloneNode(true))
      }
      const lapWidth = track.scrollWidth
      const currentUnits = Array.prototype.slice.call(track.children)
      currentUnits.forEach((u) => track.appendChild(u.cloneNode(true)))

      const speed = 70
      const duration = lapWidth / speed
      track.style.animation = ''
      track.classList.add('animate-marquee')
      track.style.animationDuration = duration + 's'
    }
    build()

    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(build, 150)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  return (
    <div className="marquee" ref={containerRef}>
      <div className="marquee-track" ref={trackRef}>
        <div className="marquee-unit" ref={baseUnitRef}>
          {WORDS.map((w) => (
            <Fragment key={w}>
              <span>{w}</span>
              <span className="marquee-sep">—</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
