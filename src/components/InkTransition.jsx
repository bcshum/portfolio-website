import { useTransition } from '../context/TransitionContext'

/* Full-screen port of Ryan Yu's CodePen transition using the same sprite,
   but applied as a disappearing screen over the destination content. That
   matches the original visual logic more closely: you start on a flat
   screen, then the page is revealed through the dispersing ink mask. */
export default function InkTransition() {
  const { phase, inkColor, variant } = useTransition()
  const visible = variant === 'ryan' && phase !== 'idle'

  const className = [
    'ink-ryan-layer',
    visible && 'visible',
    phase === 'covered' && 'covered',
    phase === 'closing' && 'revealing',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      aria-hidden="true"
    >
      <div className="ink-ryan-frame" style={{ backgroundColor: inkColor }} />
    </div>
  )
}
