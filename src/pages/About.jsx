import Reveal from '../components/Reveal'
import Eyebrow from '../components/Eyebrow'
import ScrollBlurText from '../components/ScrollBlurText'

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Eyebrow label="About" />
          <ScrollBlurText as="h1">Hello, I'm Bryan Shum.</ScrollBlurText>
        </div>
      </section>

      <Reveal as="section" className="section">
        <div className="container">
          <ScrollBlurText as="p" className="section-lead">Cognitive Science × Interactive Arts & Technology.</ScrollBlurText>
          <div className="section-body" style={{ maxWidth: '60ch' }}>
            <ScrollBlurText as="p">
              I am a Cognitive Science and Interactive Arts and Technology student. I am
              an interaction and graphic designer who is passionate about the intersection
              between human behaviour and digital technology. I believe that by
              understanding how people perceive, process, and interact with information,
              I can create interfaces that are visually compelling and cognitively
              intuitive to use by merging research-based design methods with expressive
              visual elements.
            </ScrollBlurText>
            <ScrollBlurText as="p">
              My technical skills include proficiency in design software such as Adobe
              Photoshop, Illustrator, InDesign and Figma, as well as prototyping software
              including ProtoPie, UXPin, Balsamiq and animation/modelling software Autodesk
              Maya.
            </ScrollBlurText>
          </div>
        </div>
      </Reveal>
    </>
  )
}
