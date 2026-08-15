import { useEffect, useRef } from 'react'
import { useTransition } from '../context/TransitionContext'

const FRAME_PROPORTION = 640 / 360
const FRAMES = 25

/* Previous sprite-sheet implementation kept intact so the transition can
   be swapped back quickly if the SVG version isn't better. */
export default function InkTransitionSprite() {
  const { phase, inkColor, variant } = useTransition()
  const bgRef = useRef(null)
  const visible = variant === 'cody' && phase !== 'idle'

  useEffect(() => {
    function setLayerDimensions() {
      const bg = bgRef.current
      if (!bg) return
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      let layerWidth
      let layerHeight

      if (windowWidth / windowHeight > FRAME_PROPORTION) {
        layerWidth = windowWidth
        layerHeight = layerWidth / FRAME_PROPORTION
      } else {
        layerHeight = windowHeight * 1.2
        layerWidth = layerHeight * FRAME_PROPORTION
      }

      bg.style.width = layerWidth * FRAMES + 'px'
      bg.style.height = layerHeight + 'px'
    }

    setLayerDimensions()
    window.addEventListener('resize', setLayerDimensions)
    return () => window.removeEventListener('resize', setLayerDimensions)
  }, [])

  const className = [
    'ink-transition-layer',
    visible && 'visible',
    phase === 'opening' && 'opening',
    phase === 'covered' && 'covered',
    phase === 'closing' && 'closing',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ backgroundColor: phase === 'covered' ? inkColor : 'transparent' }}
    >
      <div
        ref={bgRef}
        className="ink-bg-layer"
        style={{ backgroundColor: inkColor }}
      />
    </div>
  )
}
