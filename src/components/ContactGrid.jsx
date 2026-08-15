import { useState } from 'react'

const CARDS = [
  { href: 'mailto:bcshum@sfu.ca', label: 'Email', value: 'bcshum@sfu.ca', aria: 'Send email' },
  { href: '#', label: 'LinkedIn', value: 'Visit Profile', aria: 'Visit LinkedIn profile (placeholder)' },
  { href: '#', label: 'GitHub', value: 'View Work', aria: 'Visit GitHub profile (placeholder)' },
]

/* Port of the contact cards' "hover dims siblings" (initGroupHighlight) —
   same reasoning as CapabilityList: local siblings, so plain state instead
   of the vanilla version's querySelectorAll + classList toggling. */
export default function ContactGrid() {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="contact-grid">
      {CARDS.map((c, i) => (
        <a
          key={c.label}
          href={c.href}
          className={`contact-card${hovered !== null && hovered !== i ? ' is-dimmed' : ''}`}
          aria-label={c.aria}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="contact-label">{c.label}</div>
          <div className="contact-value">{c.value}</div>
        </a>
      ))}
    </div>
  )
}
