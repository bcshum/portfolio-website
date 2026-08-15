import { useRef } from 'react'
import Reveal from '../components/Reveal'
import Eyebrow from '../components/Eyebrow'
import WorkFeature from '../components/WorkFeature'
import ScrollBlurText from '../components/ScrollBlurText'

export default function Work() {
  const workGroupRef = useRef(null)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Eyebrow label="Work" />
          <ScrollBlurText as="h1">Selected Projects</ScrollBlurText>
          <ScrollBlurText as="p">Research-driven interaction design work across UX, branding, and motion.</ScrollBlurText>
        </div>
      </section>

      <Reveal as="section" className="section work-spotlight-group" ref={workGroupRef}>
        <div className="container">
          <WorkFeature
            to="/work/stussy"
            groupRef={workGroupRef}
            meta="Case Study — Web Usability & Interaction Design"
            title="Stüssy Web Experience Redesign"
            description="An interactive web experience featuring a virtual mannequin tool, curated outfit examples, and a community gallery to help users new to streetwear culture shop with confidence and style."
          />

          <div className="work-more">More Work — Coming Soon</div>
        </div>
      </Reveal>
    </>
  )
}
