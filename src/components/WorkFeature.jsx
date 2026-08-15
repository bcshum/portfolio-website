import { useRef } from 'react'
import TransitionLink from './TransitionLink'
import ScrollBlurText from './ScrollBlurText'

/* Port of the Stüssy work-feature card, merging two vanilla behaviors:
   - initWorkPreviewVideos(): play the muted preview video on hover, pause
     on leave.
   - initWorkSpotlight(): hovering the feature dims the rest of the page
     (basement.studio "trusted by" treatment) and reveals the project name
     next to the section eyebrow.
   The spotlight dim reaches outside this component's own subtree (it dims
   sibling <section>s, the header, the footer, the marquee — none of which
   are descendants of WorkFeature), so it's done the same way the vanilla
   version did it: direct DOM class toggling via querySelectorAll, scoped
   to the ancestor `.work-spotlight-group` passed in via `groupRef`. That's
   the one place in this component that deliberately isn't "pure React
   state" — the affected elements live in entirely different components
   (Nav, Footer, Marquee, other page sections), so lifting state up to a
   shared ancestor would mean threading spotlight state through the whole
   page tree for a single hover effect. */
export default function WorkFeature({ to, meta, title, description, groupRef }) {
  const videoRef = useRef(null)

  function handleEnter() {
    const group = groupRef?.current
    if (group) group.classList.add('is-work-active')
    document.querySelectorAll('main > section, header, footer, .marquee').forEach((el) => {
      if (!group || (el !== group && !group.contains(el))) el.classList.add('is-dimmed')
    })
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      const playPromise = video.play()
      if (playPromise && playPromise.catch) playPromise.catch(() => {})
    }
  }

  function handleLeave() {
    const group = groupRef?.current
    if (group) group.classList.remove('is-work-active')
    document.querySelectorAll('.is-dimmed').forEach((el) => el.classList.remove('is-dimmed'))
    const video = videoRef.current
    if (video) video.pause()
  }

  return (
    <TransitionLink
      to={to}
      className="work-feature"
      data-cursor-hover
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="work-feature-media">
        <picture>
          <source
            srcSet="/img/project-curated-outfits-400.WEBP 400w, /img/project-curated-outfits-800.WEBP 800w, /img/project-curated-outfits-1200.WEBP 1200w"
            sizes="100vw"
            type="image/WEBP"
          />
          <img
            src="/img/project-curated-outfits-800.WEBP"
            alt="Curated outfit examples from the Stüssy web experience redesign"
            loading="lazy"
          />
        </picture>
        <video ref={videoRef} muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/video/project-virtual-mannequin-video.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="work-feature-body">
        <div className="work-feature-meta">{meta}</div>
        <div>
          <ScrollBlurText as="h3">{title}</ScrollBlurText>
          <ScrollBlurText as="p">{description}</ScrollBlurText>
          <span className="btn">View Case Study <span className="btn-arrow">→</span></span>
        </div>
      </div>
    </TransitionLink>
  )
}
