import { motion } from 'motion/react'

/* Port of Codrops' "On-Scroll Blur Reveal" (tympanus.net/Development/ScrollBlurTypography),
   effect-1: each character starts blurred/dimmed and sharpens in as its
   containing text block enters the viewport. The reference scrubs this
   continuously to scroll position via GSAP ScrollTrigger, which also means
   scrolling back up re-blurs already-revealed text — per feedback this
   should instead be a one-time reveal per mount, same semantics as
   Reveal.jsx's whileInView + viewport once:true fade-in, just applied per
   character instead of to the whole block. Values tuned down from the
   reference (10px blur / 0% brightness) since that read as too aggressive. */

const BLUR_PX = 5
const START_BRIGHTNESS = 55
const MAX_STAGGER_DELAY = 0.25

export default function ScrollBlurText({ as: Tag = 'p', children, className, ...props }) {
  const text = typeof children === 'string' ? children : ''
  const tokens = text.split(/(\s+)/)
  let charIndex = 0

  return (
    <Tag className={className} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, ti) => {
          if (/^\s+$/.test(token) || token === '') return token
          const chars = token.split('')
          const startIndex = charIndex
          charIndex += chars.length
          return (
            <span key={ti} style={{ display: 'inline-block' }}>
              {chars.map((c, ci) => {
                const i = startIndex + ci
                return (
                  <motion.span
                    key={ci}
                    style={{ display: 'inline-block', willChange: 'filter' }}
                    initial={{ filter: `blur(${BLUR_PX}px) brightness(${START_BRIGHTNESS}%)` }}
                    whileInView={{ filter: 'blur(0px) brightness(100%)' }}
                    viewport={{ once: true, amount: 0.05, margin: '0px 0px 20% 0px' }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: Math.min(i * 0.008, MAX_STAGGER_DELAY) }}
                  >
                    {c}
                  </motion.span>
                )
              })}
            </span>
          )
        })}
      </span>
    </Tag>
  )
}
