import { Link } from "react-router-dom";
import { CaseStoryCard } from "../components/cases/CaseStoryCard";
import { Button } from "../components/common/Button";
import { CTASection } from "../components/common/CTASection";
import { SectionHeading } from "../components/common/SectionHeading";
import { ImpactSnapshot } from "../components/stats/ImpactSnapshot";
import { StatsDashboard } from "../components/stats/StatsDashboard";
import { fallbackCaseStories } from "../data/statsFallback";

const difference = [
  "Verified Zakat and Sadaqah cases",
  "Tools, assets, courses, and job readiness",
  "Mentorship from IITs and professionals",
  "Public monthly reporting without private data",
];

const landingGist = [
  {
    title: "Give with clarity",
    text: "Donors see public, aggregated reports while private recipient and donor details stay protected.",
  },
  {
    title: "Support earning",
    text: "Funds go toward practical turning points: a sewing machine, course, tool kit, shop stock, or mobility support.",
  },
  {
    title: "Mentor the next step",
    text: "Volunteers help students and job seekers with resumes, interviews, communication, coding, and career direction.",
  },
  {
    title: "Refer responsibly",
    text: "Cases are reviewed before support is shared, with Zakat and Sadaqah tracked separately.",
  },
];

export const Home = () => (
  <>
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>
            From support to{" "}
            <span className="whitespace-nowrap">self-reliance.</span>
          </h1>
          <p>
            A charity community, supporting verified Zakat and Sadaqah cases
            through livelihoods, skills, and mentorship.
          </p>
          <div className="hero-actions">
            <Button to="/our-model" variant="secondary">View Our Work</Button>
            <Button to="/donate" variant="secondary">
              Join Donor Community
            </Button>
            <Button to="/contact" variant="secondary">
              Refer a Case
            </Button>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Abstract geometric impact illustration"
        >
          <div className="visual-card large">
            <span>
              A sewing machine, a course, a tool kit, an e-rickshaw, a mentor.
            </span>
          </div>
          <div className="visual-card small">
            The right support can become a family’s turning point.
          </div>
        </div>
      </div>
    </section>

    <main>
      <section className="container section">
        <SectionHeading
          title="Case stories"
          content="See the support, not private details. Each story can show a small photo catalogue of the tools, machines, supplies, or learning support arranged for the case."
        />
        <div className="case-grid">
          {fallbackCaseStories.slice(0, 3).map((story) => (
            <CaseStoryCard key={story.case_id} story={story} />
          ))}
        </div>
        <p className="section-link">
          <Link to="/case-stories">View all anonymized stories</Link>
        </p>
      </section>

      <section className="container section">
        <SectionHeading
          title="How it works"
          content="A clear path from need to earning: verification, practical support, follow-up, and public reporting."
        />
        <div className="home-category-grid">
          {landingGist.map((item) => (
            <article className="feature-card" key={item.title}>
              <span aria-hidden="true">✦</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container section section-tight impact-snapshot-section">
        <SectionHeading
          title="Impact snapshot"
          content="Quick public signals before the details: community size, case tracking, and reporting structure."
        />
        <ImpactSnapshot />
      </section>

      <section className="container section">
        <SectionHeading
          title="Our model"
          content="Livelihood, skills, and mentorship for people to stand on their own feet, not just receive one-time aid."
        />
        <div className="feature-grid">
          {difference.map((item) => (
            <article className="feature-card" key={item}>
              <span aria-hidden="true">✦</span>
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="container section">
        <StatsDashboard variant="preview" />
      </section>

      <section className="container section split-band">
        <div>
          <h2>
            Volunteers help students and job seekers move with confidence.
          </h2>
          <p>
            Mentors from IITs, colleges, and professional backgrounds support
            resume review, interview preparation, coding, English communication,
            career direction, and course selection.
          </p>
        </div>
        <Button to="/mentorship" variant="secondary">
          Explore Mentorship
        </Button>
      </section>

      <section className="container section split-band muted-band">
        <div>
          <h2>Zakat and Sadaqah are tracked separately in monthly reports.</h2>
          <p>
            Stats are aggregated and privacy-safe. No recipient names, phone
            numbers, donor names, documents, payment IDs, or private case notes
            are published.
          </p>
        </div>
        <Button to="/reports" variant="secondary">
          View Reports
        </Button>
      </section>

      <div className="container section">
        <CTASection />
      </div>
    </main>
  </>
);
