import Reveal from '../components/Reveal'
import Eyebrow from '../components/Eyebrow'
import ContactGrid from '../components/ContactGrid'
import ScrollBlurText from '../components/ScrollBlurText'

export default function Contact() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Eyebrow label="Contact" />
          <ScrollBlurText as="h1">Get In Touch</ScrollBlurText>
          <ScrollBlurText as="p">
            I'm currently open to new opportunities and collaborations. Whether you have a
            question or just want to say hello, feel free to reach out!
          </ScrollBlurText>
        </div>
      </section>

      <Reveal as="section" className="section">
        <div className="container">
          <ContactGrid />

          <div className="closing-band">
            <ScrollBlurText as="p" className="closing-text">Let's create something impactful.</ScrollBlurText>
          </div>
        </div>
      </Reveal>
    </>
  )
}
