import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLocation } from 'react-router'
import { useTransition } from '../context/TransitionContext'
import { useTheme } from '../context/ThemeContext'
import { useMenu } from '../context/MenuContext'
import { measureCharEm } from '../lib/textMeasure'
import ThemeToggle from './ThemeToggle'
import SideMenuItem, { EXPO_INOUT } from './SideMenuItem'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/work', label: 'Work' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

/* The word whose letters get woven into the menu items' first letter once
   the menu opens (see SideMenuItem) — exactly 4 letters for exactly 4 nav
   items, one-to-one, same as the reference used "HAPUKU" for its 6 items. */
const HIDDEN_WORD = 'SHUM'

/* Faithful to the reference's actual architecture (not the "hidden until
   toggled overlay" I built the first time around): the letters, button,
   and tagline live in ONE persistent layer that never moves or hides —
   at rest it shows a compact column of just each item's hidden-word
   letter. A SEPARATE element behind it (.side-menu__bg equivalent) is
   the only thing that translates off/on-screen; opening it is what
   reveals the colored panel the fully-spelled-out, shuffled words sit
   against.

   Unlike the reference (which overlays the panel on top of page content
   with a dimming backdrop), this pushes the actual page content over
   instead — see App.jsx's Layout, which reads the same `open` state via
   MenuContext to animate its own left padding to var(--side-menu-open-w).
   Both this panel's width and that padding reference the same CSS custom
   properties (defined once in index.css) so they can never drift out of
   sync. */
export default function SideMenu() {
  const { open, setOpen } = useMenu()
  const { theme } = useTheme()
  const location = useLocation()
  const { goTo } = useTransition()
  const navTimerRef = useRef(null)
  const MENU_CLOSE_BEFORE_NAV_MS = 760
  const [hovered, setHovered] = useState(null)

  const activeIndex = useMemo(() => {
    const index = LINKS.findIndex((l) => (l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)))
    return index === -1 ? 0 : index
  }, [location.pathname])

  function handleNavigate(to) {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current)
      navTimerRef.current = null
    }

    setOpen(false)
    navTimerRef.current = setTimeout(() => {
      goTo(to)
      navTimerRef.current = null
    }, MENU_CLOSE_BEFORE_NAV_MS)
  }

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) setHovered(null)
  }, [open])

  // Real glyph widths need the webfont loaded to measure correctly —
  // before then, canvas falls back to a generic serif and gives wrong
  // widths. Re-measured once fonts.ready resolves.
  const [fontsReady, setFontsReady] = useState(false)
  useLayoutEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  /* One shared cell width for ALL four items' reel letter (not each item
     measuring its own letter independently) — sized to the widest letter
     that needs to fit in the current state (closed: widest of S/H/U/M;
     open: widest of H/W/A/C), then centered within that shared width via
     justify-content:center in SideMenuItem. Per-item widths kept the left
     edges aligned but each letter's own width still varied, so the column
     read as visually uneven (a "centered as a group" look reads more
     unified than "each individually left-aligned"). */
  const reelWidthEm = useMemo(() => {
    if (!fontsReady) return 0.75
    const letters = open ? LINKS.map((l) => l.label[0]) : HIDDEN_WORD.split('')
    return Math.max(...letters.map(measureCharEm)) * 1.08
  }, [fontsReady, open])

  const menuPanelColor = theme === 'dark' ? '#FDFBF7' : '#000000'
  const openTextClass = theme === 'dark' ? 'text-[#1A1714]' : 'text-paper'
  const highlightedIndex = hovered ?? activeIndex

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-[110] flex flex-col items-center pointer-events-none ${
          open ? openTextClass : 'text-ink'
        } side-menu-shell-visible`}
        style={{ width: 'var(--side-menu-closed-w)' }}
      >
        {/* The sliding background — the ONLY element that moves off-screen.
            Negative z-index keeps it behind the always-visible letters
            while still being a sibling (not a wrapper), so it can be
            wider than the letter column without affecting layout. Right
            border in the accent color ties it to the same rust/gold
            divider treatment used elsewhere on the site (nav underline,
            eyebrow ticks, section dividers). */}
        <motion.div
          className="absolute inset-y-0 left-0 -z-10 pointer-events-none"
          style={{ width: 'var(--side-menu-open-w)', backgroundColor: menuPanelColor }}
          initial={false}
          animate={{ x: open ? '0%' : '-100%' }}
          transition={{ duration: open ? 1.1 : 0.9, ease: EXPO_INOUT }}
        />

        <button
          type="button"
          className="pointer-events-auto relative w-9 h-9 flex items-center justify-center my-5"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="side-menu-items"
          aria-label="Toggle menu"
        >
          <svg width="22" height="23" viewBox="0 0 22 23">
            <motion.path
              d="M0 3h22M0 11h22M0 19h22"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              animate={{ opacity: open ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M19.64.359 2.36 22.641m17.28 0L2.36.359"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        </button>

        <nav
          id="side-menu-items"
          className={`flex flex-col items-start gap-1 mt-2 self-start ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            fontSize: 'clamp(3rem, 7.5vw, 5.5rem)',
            paddingLeft: `calc((var(--side-menu-closed-w) - ${reelWidthEm}em) / 2)`,
          }}
        >
          {LINKS.map((l, i) => {
            const isActive = l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)
            return (
              <SideMenuItem
                key={l.to}
                to={l.to}
                label={l.label}
                hiddenLetter={HIDDEN_WORD[i % HIDDEN_WORD.length]}
                reelWidthEm={reelWidthEm}
                index={i}
                isActive={isActive}
                open={open}
                hovered={open && hovered === i}
                highlighted={open && highlightedIndex === i}
                dimmed={open && highlightedIndex !== i}
                onHoverChange={(active) => setHovered(active ? i : null)}
                onNavigate={handleNavigate}
              />
            )
          })}
        </nav>

        {!open && (
          <span
            className="side-menu-seal self-start pointer-events-none"
            aria-hidden="true"
            style={{ marginLeft: `calc((var(--side-menu-closed-w) - var(--side-menu-seal-w)) / 2)` }}
          >
            <img src="/img/seal.png" alt="" />
          </span>
        )}

        <motion.span
          className="hidden md:block side-menu-tagline pointer-events-none mb-10 mt-auto"
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          aria-hidden="true"
        >
          UX / Product Design
        </motion.span>

      </aside>

      <div className="pointer-events-auto fixed top-5 right-5 z-[120]">
        <ThemeToggle />
      </div>

      {/* Transparent click-catcher over just the (now pushed-over) content
          area, not the menu itself — clicking anywhere in the actual page
          content closes the menu. No dimming here since content is no
          longer covered, just shifted. */}
      {open && (
        <div
          className="fixed inset-y-0 right-0 z-[104]"
          style={{ left: 'var(--side-menu-open-w)' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
