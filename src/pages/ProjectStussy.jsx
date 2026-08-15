import Reveal from '../components/Reveal'
import TransitionLink from '../components/TransitionLink'
import ScrollBlurText from '../components/ScrollBlurText'

export default function ProjectStussy() {
  return (
    <div className="container case-content grain-safe-zone">
      <section className="case-header">
        <TransitionLink
          to="/work"
          className="btn"
          style={{ marginBottom: 'var(--space-6)', display: 'inline-flex' }}
        >
          <span className="btn-arrow" style={{ transform: 'rotate(180deg)' }}>→</span> Back to Work
        </TransitionLink>
        <div className="case-meta">Web Usability and Interaction Design · 4 Weeks · Team of 5</div>
        <ScrollBlurText as="h1" className="case-title">Stüssy Web Experience Redesign</ScrollBlurText>
      </section>

      <Reveal as="section" className="section">
        <div className="section-body" style={{ maxWidth: '62ch' }}>
          <ScrollBlurText as="p">
            This five-person project for IAT 235 asked us to design a solution for a
            web-based business that could benefit from usability improvements. It was a
            collaborative project where everyone, including myself, contributed to
            research, writing, designing, prototyping and presentation. Our final concept
            for streetwear brand Stüssy proposed an interactive web experience featuring a
            virtual mannequin tool, curated outfit examples and a community gallery to
            help users who are new to streetwear culture shop with confidence and style.
          </ScrollBlurText>
        </div>
      </Reveal>

      <Reveal as="section" className="section" style={{ paddingTop: 0 }}>
        <div className="step">
          <div className="step-marker">
            <span className="step-dot" />
            <span className="step-num">01</span>
          </div>
          <div className="step-content">
            <ScrollBlurText as="h3">Research & Insights</ScrollBlurText>
            <ScrollBlurText as="p">
              My first step was selecting a business and researching its current
              platform, user base and potential usability issues. Through research into
              Stüssy, customer comments and secondary sources, I helped define three key
              insights supported by statistics:
            </ScrollBlurText>
            <ul>
              <li>Sizing inconsistencies create frustration and high return rates in online apparel (Statista, 2023).</li>
              <li>It is difficult to match niche streetwear pieces into cohesive outfits (Friedman, 2013).</li>
              <li>Shopping anxiety, especially for users unsure of their style, is common (Radin, 2022; Anxiety Canada).</li>
            </ul>

            <figure className="case-figure">
              <picture>
                <source
                  srcSet="/img/project-insights-400.WEBP 400w, /img/project-insights-800.WEBP 800w, /img/project-insights-1200.WEBP 1200w"
                  sizes="(min-width: 700px) 52rem, 100vw"
                  type="image/WEBP"
                />
                <img src="/img/project-insights-800.WEBP" alt="Research insights visual for the Stüssy web experience project" loading="lazy" />
              </picture>
              <figcaption>Insights — Image 01</figcaption>
            </figure>

            <ScrollBlurText as="p">
              These insights showed that people struggle with niche pieces because of
              body image and fitting issues, and that sizing in online shopping often
              leads to practices like "bracketing" and avoidable returns. Grounding the
              project in this research justified why an intervention was needed.
            </ScrollBlurText>
          </div>
        </div>

        <div className="step">
          <div className="step-marker">
            <span className="step-dot" />
            <span className="step-num">02</span>
          </div>
          <div className="step-content">
            <ScrollBlurText as="h3">Framing the Problem</ScrollBlurText>
            <ScrollBlurText as="p">
              Working iteratively with instructor feedback, I refined the framing and
              problem statement so they were clear and tangible.
            </ScrollBlurText>
            <p>
              <em>Framing:</em> How might we encourage those new to fashion to experience
              streetwear culture and express themselves in a way that is unique to their
              own identity by providing them with foundational fashion knowledge?
            </p>
            <p>
              <em>Problem statement:</em> We propose to create a supportive shopping aide
              that gives streetwear beginners guidance for outfit matching and better
              visualisation of sizing in order to reduce doubt while shopping.
            </p>
            <ScrollBlurText as="p">
              These statements emerged from deeper research into the company, its
              customers and streetwear fashion more broadly. We collected this
              information and distilled it into three key insights accompanied by
              "driving statistics". This directly informed our design concept of an
              interactive virtual mannequin tool that lets users experiment with outfits,
              sizing and style before purchasing. By grounding the concept in measurable
              problems, we ensured the solution was not just creative, but necessary and
              impactful.
            </ScrollBlurText>
            <ScrollBlurText as="p">
              In terms of text and presentation, I focused on making the framing and
              problem statement concise enough to keep the team aligned throughout design
              and not be pulled in unrelated directions. Although the project was very
              visual, it was important that our interface and curated outfits clearly
              communicated what was and was not possible. Showing accurate product
              imagery alongside authentic community styling reinforced user trust and
              confidence.
            </ScrollBlurText>
          </div>
        </div>

        <div className="step">
          <div className="step-marker">
            <span className="step-dot" />
            <span className="step-num">03</span>
          </div>
          <div className="step-content">
            <ScrollBlurText as="h3">Concept Development & Design</ScrollBlurText>
            <ScrollBlurText as="p">
              I established a 3-step process for integrating individuals new to
              streetwear fashion:
            </ScrollBlurText>

            <figure className="case-figure">
              <picture>
                <source
                  srcSet="/img/project-learning-curve-400.WEBP 400w, /img/project-learning-curve-800.WEBP 800w, /img/project-learning-curve-1200.WEBP 1200w"
                  sizes="(min-width: 700px) 52rem, 100vw"
                  type="image/WEBP"
                />
                <img src="/img/project-learning-curve-800.WEBP" alt="Learning curve / reflection visual for the IAT 235 project" loading="lazy" />
              </picture>
              <figcaption>Learning Curve — Image 02</figcaption>
            </figure>

            <p>
              <strong>Examination phase:</strong> A new product page module featuring
              curated outfit examples with links to the other products shown, and a
              community gallery where customers could post images of themselves wearing
              that piece. This served as a form of visual learning, helping newcomers
              understand how to style streetwear outfits.
            </p>

            <figure className="case-figure">
              <picture>
                <source
                  srcSet="/img/project-curated-outfits-400.WEBP 400w, /img/project-curated-outfits-800.WEBP 800w, /img/project-curated-outfits-1200.WEBP 1200w"
                  sizes="(min-width: 700px) 52rem, 100vw"
                  type="image/WEBP"
                />
                <img src="/img/project-curated-outfits-800.WEBP" alt="Curated streetwear outfit examples from the Stüssy concept" loading="lazy" />
              </picture>
              <figcaption>Curated Outfits — Image 03</figcaption>
            </figure>

            <p>
              <strong>Experience phase:</strong> An adjustable virtual mannequin matching
              user attributes. Customers could apply the clothing items from their cart
              to preview a complete outfit before purchase.
            </p>

            <figure className="case-figure">
              <video className="project-video" controls>
                <source src="/video/project-virtual-mannequin-video.mp4" type="video/mp4" />
              </video>
              <figcaption>Virtual Mannequin — Video 01</figcaption>
            </figure>

            <p>
              <strong>Expression:</strong> Users could then try products on in real life
              and share their styled looks back to the community portal, continuing the
              cycle of inspiration and learning for others.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="step-marker">
            <span className="step-dot" />
            <span className="step-num">04</span>
          </div>
          <div className="step-content">
            <ScrollBlurText as="h3">Prototype & Reflection</ScrollBlurText>
            <ScrollBlurText as="p">
              The final step was designing interactions through Figma and animating a
              user journey with Premiere Pro.
            </ScrollBlurText>
            <ScrollBlurText as="p">
              The biggest challenge was identifying a problem that was both research
              backed and within our scope so we could design a solution that could make
              tangible impact. I learned the importance of validating ideas with data,
              framing them clearly, and creating features informed by this research.
            </ScrollBlurText>
            <ScrollBlurText as="p">
              By supporting our initial concept with statistics and user insights, we
              built a solution that was both credible and tangible. This reflects my
              ethos as a designer who uses data to inform concepts and clear
              communication to turn them into real, accessible, user-centred experiences.
            </ScrollBlurText>
          </div>
        </div>

        <div className="tag-row">
          <span className="tag">Justification with research and statistics</span>
          <span className="tag">Clear and focused framing</span>
          <span className="tag">Communicating insights and design to stakeholders</span>
        </div>
      </Reveal>
    </div>
  )
}
