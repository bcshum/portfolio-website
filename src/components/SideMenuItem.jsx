import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { measureCharEm } from '../lib/textMeasure'

const REEL_SIZE = 8
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
export const EXPO_INOUT = [0.87, 0, 0.13, 1] // approximates GSAP's expo.inOut

function randomLetter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
}

/* Port of the "slot machine" first-letter mechanic from Codrops' Letter
   Shuffle Menu (https://tympanus.net/codrops/2022/03/23/letter-shuffle-animation-for-a-menu/),
   with the semantics flipped per feedback: at rest the reel shows the
   hidden word's letter (so the closed rail reads "S H U M" going down the
   page), and OPENING the menu is what reveals the real first letter of
   each item.

   REEL_SIZE letters total, slots 0-1 (top of the DOM stack) = hidden-word
   letter duplicated, slots 6-7 (bottom) = the item's real first letter
   duplicated. Duplicating the resting letter at both ends (instead of a
   single copy) means that if the reveal transform lands a hair off exact
   — a sub-pixel rounding risk inherent to stacking 8 elements and
   clipping via overflow — whatever sliver peeks in from the adjacent slot
   is just another copy of the SAME letter, not a stray fragment of an
   unrelated random one. The window (.side-menu-letter-wrap) is top-aligned
   to the reel (align-items: flex-start in CSS), so untransformed it shows
   slot 0 at rest. To reveal the last slot on open, the reel moves UP
   (negative translateY) by 7 of its own 8 slot-heights — done in measured
   pixels rather than a CSS percentage, since percentages are exact only if
   8 stacked elements' rendered heights sum to precisely 8x one element's
   height, which isn't guaranteed once heights land on fractional device
   pixels. */
export default function SideMenuItem({
  to,
  label,
  hiddenLetter,
  reelWidthEm,
  open,
  index,
  isActive,
  hovered = false,
  highlighted = false,
  dimmed = false,
  onHoverChange,
  onNavigate,
}) {
  const chars = useMemo(() => label.split(''), [label])
  const firstChar = chars[0]
  const restChars = chars.slice(1)

  const reelLetters = useMemo(() => {
    const randoms = Array.from({ length: REEL_SIZE - 4 }, randomLetter)
    return [hiddenLetter, hiddenLetter, ...randoms, firstChar, firstChar]
  }, [firstChar, hiddenLetter])

  // Real glyph widths need the webfont actually loaded to measure
  // correctly — before then, canvas would fall back to a generic serif
  // and give wrong widths. Falls back to a reasonable flat estimate for
  // the first paint, then re-measures once fonts.ready resolves.
  const [fontsReady, setFontsReady] = useState(false)
  useLayoutEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // Each rest-of-word letter's own isolated advance width (the font's own
  // side-bearings are already baked into that), with a small margin so
  // adjacent cells never visually touch/overlap. An earlier version tried
  // to be clever and measure each pair's kerning (width of "prevChar+char"
  // minus width of "prevChar" alone) for tighter, more "natural" spacing —
  // but that pair-subtraction technique occasionally under-measured badly
  // enough to visually overlap two letters (reported as "o squished into
  // r" in Work). Isolated widths are less precisely kerned but can't
  // produce a negative/too-small gap the same way.
  const restWidthsEm = useMemo(() => {
    if (!fontsReady) return restChars.map(() => 0.55)
    return restChars.map((c) => measureCharEm(c) * 1.08)
  }, [fontsReady, restChars])

  // The reel's reveal distance is computed in measured pixels rather than
  // a CSS percentage (percent-of-the-reel's-own-height) for the same
  // sub-pixel-rounding reason described above.
  const wrapRef = useRef(null)
  const [slotHeightPx, setSlotHeightPx] = useState(0)
  useLayoutEffect(() => {
    function measure() {
      if (wrapRef.current) setSlotHeightPx(wrapRef.current.getBoundingClientRect().height)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [fontsReady, reelWidthEm])

  const stagger = index * 0.05
  const duration = open ? 1.1 : 0.8

  function renderRow(rowKey, duplicate = false) {
    return (
      <span className="side-menu-word-row" key={rowKey} aria-hidden={duplicate}>
        <span
          className="side-menu-letter-wrap"
          ref={duplicate ? null : wrapRef}
          style={{ width: `${reelWidthEm}em` }}
        >
          <motion.span
            className="side-menu-reel"
            initial={false}
            animate={{ y: open ? -(slotHeightPx * (REEL_SIZE - 1)) : 0 }}
            transition={{ duration, ease: EXPO_INOUT, delay: open ? stagger : 0 }}
          >
            {reelLetters.map((l, i) => (
              <span key={i} style={{ width: `${reelWidthEm}em` }}>
                {l}
              </span>
            ))}
          </motion.span>
        </span>
        {restChars.map((c, i) => (
          <span className="side-menu-letter-wrap" key={`${rowKey}-${i}`} style={{ width: `${restWidthsEm[i]}em` }}>
            <motion.span
              className="side-menu-rest-char"
              initial={false}
              style={{ width: `${restWidthsEm[i]}em` }}
              animate={
                open
                  ? { x: '0%', opacity: 1, rotate: 0 }
                  : { x: '100%', opacity: 0, rotate: 10 }
              }
              transition={{ duration, ease: EXPO_INOUT, delay: open ? stagger + i * 0.04 : 0 }}
            >
              {c}
            </motion.span>
          </span>
        ))}
      </span>
    )
  }

  return (
    <a
      href={to}
      // overflow-hidden + a width that snaps between "one letter cell"
      // (the shared reel width, same for all four items) and "fits the
      // whole word" is what actually keeps the rest-of-word letters
      // invisible/non-interactive at rest — opacity:0 alone still leaves
      // their layout box (and click target) at full word width, which is
      // what made the closed rail feel broken/"off" before.
      className={`side-menu-item ${isActive ? 'side-menu-item--active' : ''}${highlighted ? ' is-highlighted' : ''}${hovered ? ' is-hovered' : ''}${dimmed ? ' is-dimmed' : ''}${!open ? ' is-closed' : ''}`}
      style={{ width: open ? 'max-content' : `${reelWidthEm}em` }}
      onClick={(e) => {
        e.preventDefault()
        onNavigate(to)
      }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
    >
      <span className={`side-menu-word-window${open ? ' is-open' : ''}`}>
        <span className="side-menu-word-track">
          {renderRow('primary')}
          {renderRow('duplicate', true)}
        </span>
      </span>
    </a>
  )
}
