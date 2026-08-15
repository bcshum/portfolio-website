import { useTransition } from '../context/TransitionContext'

/* Drop-in replacement for react-router's <Link> that plays the ink
   transition before actually navigating (see TransitionContext). Forwards
   any extra props (className, data-cursor-hover, onMouseEnter, etc.) so it
   can stand in for <Link> anywhere, including inside WorkFeature. */
export default function TransitionLink({ to, children, onClick, ...props }) {
  const { goTo } = useTransition()

  function handleClick(e) {
    e.preventDefault()
    goTo(to)
    if (onClick) onClick(e)
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
