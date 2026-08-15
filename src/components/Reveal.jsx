import { motion } from 'motion/react'

/* Port of the .reveal / .is-visible scroll-fade from main.js's
   IntersectionObserver (threshold 0.12, rootMargin '0px 0px -60px 0px',
   translateY(18px) -> 0, fires once). Motion's whileInView replaces the
   observer + class-toggle entirely.
   `as` picks which HTML tag motion renders (e.g. "section") since several
   callers need the wrapper to literally be a <section> for the
   `main > section` sibling-dimming selector used by WorkFeature's
   spotlight hover to work. */
export default function Reveal({ as = 'div', children, className, ...props }) {
  const Tag = motion[as] || motion.div
  return (
    <Tag
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  )
}
