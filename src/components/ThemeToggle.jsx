import { useTheme } from '../context/ThemeContext'

/* Matches the mono-label styling already used for the "Menu" button and
   nav links — a text toggle rather than an icon, consistent with the
   site's typographic-label visual language rather than introducing a new
   icon system just for this one control. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="font-mono text-[0.72rem] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors duration-200 border border-ink/15 hover:border-accent rounded-full px-3 py-1.5"
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  )
}
