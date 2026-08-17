import { useEffect, useRef } from 'react'
import { animate } from 'motion'

const PEAK_SCALE = 140
const PRESS_DURATION = 0.6
const RELEASE_DURATION = 0.9

export default function HeroLiquidDistortion({ as: Tag = 'section', className, children }) {
  const elRef = useRef(null)

  useEffect(() => {
    const el = elRef.current
    const feDisplace = document.querySelector('#hero-liquid-distortion feDisplacementMap')
    if (!el || !feDisplace) return

    const controls = { scale: 0 }
    let anim

    function handleDown(e) {
      anim?.stop()
      el.style.filter = 'url(#hero-liquid-distortion)'
      const rect = el.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      const bias = 0.6 + 0.4 * Math.abs(Math.sin(nx * Math.PI * 2) * Math.cos(ny * Math.PI * 2))
      anim = animate(controls, { scale: PEAK_SCALE * bias }, {
        duration: PRESS_DURATION,
        ease: 'easeOut',
        onUpdate: () => feDisplace.setAttribute('scale', controls.scale),
      })
    }

    function handleUp() {
      anim?.stop()
      anim = animate(controls, { scale: 0 }, {
        duration: RELEASE_DURATION,
        ease: 'easeOut',
        onUpdate: () => feDisplace.setAttribute('scale', controls.scale),
        onComplete: () => { el.style.filter = 'none' },
      })
    }

    el.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)

    return () => {
      anim?.stop()
      el.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
      el.style.filter = 'none'
    }
  }, [])

  return (
    <Tag ref={elRef} className={className}>
      {children}
    </Tag>
  )
}
