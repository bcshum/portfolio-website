import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

const TransitionContext = createContext(null)

const DURATION_RYAN = 1300
const DURATION_CODY = 800
const COVER_HOLD_MS = 34
const TRANSITION_SHEET = {
  lightDestination: '#0D0C0A',
  darkDestination: '#FDFBF7',
}
/* Orchestrates both route changes and theme switches. Normal page changes
   still use a covered handoff before the reveal. Theme switches can use an
   immediate reveal mode so the current page goes straight into the ink
   dispersal without a visible blank hold frame in between. */
export function TransitionProvider({ children }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'opening' | 'covered' | 'closing'
  const [inkColor, setInkColor] = useState('#000000')
  const [variant, setVariant] = useState('cody')
  const navigate = useNavigate()
  const location = useLocation()
  const timersRef = useRef([])

  const queueTimer = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }, [])

  const runTransition = useCallback((callback, color = '#000000', mode = 'two-pass', nextVariant = 'cody') => {
    if (phase !== 'idle') return false

    setInkColor(color)
    setVariant(nextVariant)

    const duration = nextVariant === 'ryan' ? DURATION_RYAN : DURATION_CODY

    if (mode === 'reveal-immediate') {
      callback()
      setPhase('closing')
      queueTimer(() => setPhase('idle'), duration)
      return true
    }

    if (mode === 'reveal-only') {
      setPhase('covered')
      callback()
      queueTimer(() => {
        setPhase('closing')
        queueTimer(() => setPhase('idle'), duration)
      }, COVER_HOLD_MS)
      return true
    }

    setPhase('opening')

    queueTimer(() => {
      setPhase('covered')
      callback()

      if (mode === 'cover-only') {
        queueTimer(() => setPhase('idle'), COVER_HOLD_MS)
        return
      }

      queueTimer(() => {
        setPhase('closing')
        queueTimer(() => setPhase('idle'), duration)
      }, COVER_HOLD_MS)
    }, duration)

    return true
  }, [phase, queueTimer])

  const goTo = useCallback((to) => {
    if (to === location.pathname) return false

    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const inkColor =
      currentTheme === 'dark'
        ? TRANSITION_SHEET.darkDestination
        : TRANSITION_SHEET.lightDestination

    return runTransition(() => {
      navigate(to)
      window.scrollTo(0, 0)
    }, inkColor, 'two-pass', 'cody')
  }, [location.pathname, navigate, runTransition])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  return (
    <TransitionContext.Provider value={{ phase, inkColor, variant, goTo, runTransition }}>
      {children}
    </TransitionContext.Provider>
  )
}

export function useTransition() {
  const ctx = useContext(TransitionContext)
  if (!ctx) throw new Error('useTransition must be used within TransitionProvider')
  return ctx
}
