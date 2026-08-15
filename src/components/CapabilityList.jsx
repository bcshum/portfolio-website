import { useState } from 'react'
import ScrollBlurText from './ScrollBlurText'

const ITEMS = [
  {
    index: '01',
    name: 'Research',
    desc: 'Heuristic evaluation, think-aloud testing, and insight synthesis grounded in cognitive science.',
  },
  {
    index: '02',
    name: 'Interaction',
    desc: 'Prototyping expressive, intuitive interfaces in Figma, ProtoPie, and UXPin.',
  },
  {
    index: '03',
    name: 'Visual Design',
    desc: 'Crafting cohesive visual systems with the Adobe Creative Suite.',
  },
]

/* Port of the Approach list's "hover dims siblings" (initGroupHighlight)
   plus the two-line vertical-slide name reveal. The vanilla version dimmed
   siblings by toggling a class via querySelectorAll; here the items are all
   local children of one list, so plain React state does the same job. */
export default function CapabilityList() {
  const [hovered, setHovered] = useState(null)

  return (
    <ul className="capability-list">
      {ITEMS.map((item, i) => (
        <li
          key={item.index}
          className={`capability-item${hovered !== null && hovered !== i ? ' is-dimmed' : ''}`}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <span className="capability-index">{item.index}</span>
          <span className="capability-name">
            <span className="capability-name-track">
              <span className="capability-name-line">{item.name}</span>
              <span className="capability-name-line" aria-hidden="true">{item.name}</span>
            </span>
          </span>
          <ScrollBlurText as="span" className="capability-desc">{item.desc}</ScrollBlurText>
        </li>
      ))}
    </ul>
  )
}
