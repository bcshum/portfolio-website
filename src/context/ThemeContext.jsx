import { createContext, useContext, useEffect, useState } from 'react'
import { useTransition } from './TransitionContext'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'theme'
const TRANSITION_SHEET = {
  lightDestination: '#0D0C0A',
  darkDestination: '#FDFBF7',
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

/* Applies the theme as a data-theme attribute on <html>; index.css swaps
   the whole color-token set (both the Tailwind @theme tokens and the plain
   CSS vars used by the ported component CSS) off that attribute, so this
   provider only needs to own the string and persist it — no color logic
   lives here. Defaults to light regardless of OS preference, per the
   "white variant is the default, dark is opt-in via a button" ask. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const { runTransition } = useTransition()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    const inkColor =
      nextTheme === 'dark'
        ? TRANSITION_SHEET.darkDestination
        : TRANSITION_SHEET.lightDestination

    runTransition(() => {
      setTheme(nextTheme)
    }, inkColor, 'reveal-immediate', 'ryan')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
