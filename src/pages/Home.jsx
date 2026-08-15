import { useRef } from 'react'
import TransitionLink from '../components/TransitionLink'
import Reveal from '../components/Reveal'
import Eyebrow from '../components/Eyebrow'
import Marquee from '../components/Marquee'
import CapabilityList from '../components/CapabilityList'
import WorkFeature from '../components/WorkFeature'
import HeroRipples from '../components/HeroRipples'
import GooeyHeroTitle from '../components/GooeyHeroTitle'
import ScrollBlurText from '../components/ScrollBlurText'

export default function Home() {
  const workGroupRef = useRef(null)

  return (
    <>
      <section className="hero">
        <HeroRipples className="hero-canvas" />

        <div className="hero-content container">
          <span className="hero-eyebrow">Portfolio — 2026</span>
          <GooeyHeroTitle text="Bryan Shum" className="hero-title" />
          <p className="hero-tagline">UX / UI Design Student</p>
          <div className="hero-actions">
            <TransitionLink to="/work" className="btn">View Work <span className="btn-arrow">→</span></TransitionLink>
            <TransitionLink to="/contact" className="btn">Get In Touch <span className="btn-arrow">→</span></TransitionLink>
          </div>
        </div>
      </section>

      <Marquee />

      <Reveal as="section" className="section">
        <div className="container">
          <Eyebrow label="About" />
          <ScrollBlurText as="p" className="section-lead">
            A Cognitive Science and Interactive Arts & Technology student designing
            interfaces at the intersection of human behaviour and digital technology.
          </ScrollBlurText>
          <div className="section-body">
            <ScrollBlurText as="p">
              I believe that by understanding how people perceive, process, and interact
              with information, I can create interfaces that are visually compelling and
              cognitively intuitive, merging research-based design methods with expressive
              visual craft.
            </ScrollBlurText>
          </div>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <TransitionLink to="/about" className="btn">More About Me <span className="btn-arrow">→</span></TransitionLink>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section section-alt">
        <div className="container">
          <Eyebrow label="Approach" />
          <CapabilityList />
        </div>
      </Reveal>

      <Reveal as="section" className="section work-spotlight-group" ref={workGroupRef}>
        <div className="container">
          <Eyebrow label="Selected Work" name="Stüssy Web Experience Redesign" />

          <WorkFeature
            to="/work/stussy"
            groupRef={workGroupRef}
            meta="Case Study — Web Usability & Interaction Design"
            title="Stüssy Web Experience Redesign"
            description="An interactive web experience featuring a virtual mannequin tool, curated outfit examples, and a community gallery — helping newcomers to streetwear culture shop with confidence."
          />

          <div className="work-more">More Work — Coming Soon</div>
        </div>
      </Reveal>

      <Reveal as="section" className="section">
        <div className="container">
          <div className="closing-band">
            <ScrollBlurText as="p" className="closing-text">Let's create something impactful.</ScrollBlurText>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <TransitionLink to="/contact" className="btn">Get In Touch <span className="btn-arrow">→</span></TransitionLink>
            </div>
          </div>
        </div>
      </Reveal>
    </>
  )
}
