import { Button } from "../components/common/Button";
import { CTASection } from "../components/common/CTASection";
import { SectionHeading } from "../components/common/SectionHeading";
import { founders } from "../data/founders";
import { site } from "../data/site";

const values = [
  "Amanah",
  "Dignity",
  "Transparency",
  "Self-reliance",
  "Community",
];
const promise = [
  "Verified cases",
  "Zakat and Sadaqah fund separation",
  "Public monthly reporting",
  "Privacy-first storytelling",
  "Follow-up wherever possible",
];
const supportAreas = [
  {
    title: "Livelihood support for blue-collar families",
    text: "We help verified recipients with the initial capital, tools, stock, machines, or equipment needed to start or strengthen a small shop, service, or daily-earning work.",
  },
  {
    title: "Skill support for white-collar job seekers",
    text: "We support useful course fees, IT learning, job readiness, and mentorship so a student or job seeker can improve skills and move toward stable employment.",
  },
  {
    title: "Mentorship that improves outcomes",
    text: "Volunteers guide students and job seekers with resumes, interviews, communication, course selection, coding, data, IT, and career direction.",
  },
];
const workingPrinciples = [
  "Support should protect dignity, not create dependency.",
  "The right help may be a sewing machine, shop stock, a tool kit, a course, an e-rickshaw, or a mentor.",
  "Today’s recipient can become tomorrow’s supporter, InshaAllah.",
];

export const About = () => (
  <main className="container page">
    <SectionHeading
      title="About Humanitarians"
      content="Humanitarians is a charity community focused on verified Zakat and Sadaqah cases, with a strong emphasis on livelihood, skills, mentorship, and dignified self-reliance."
    />

    <section className="section about-summary-panel">
      <div>
        <h2>What we do</h2>
        <p>
          Humanitarians began as a small donor community and grew into a
          structured effort to help verified families move from urgent need
          toward earning independently. We do not want support to stop at
          one-time relief where a practical path to income is possible. We try
          to fund the missing step: capital, tools, assets, courses,
          job-readiness, or mentorship.
        </p>
      </div>
      <Button href={site.aboutProfileDownload} variant="secondary" download>
        Download Humanitarians Impact Profile
      </Button>
    </section>

    <section className="section about-support-grid">
      {supportAreas.map((area) => (
        <article className="about-support-card" key={area.title}>
          <h2>{area.title}</h2>
          <p>{area.text}</p>
        </article>
      ))}
    </section>

    <section className="section two-col">
      <div className="about-info-panel">
        <h2>Our approach</h2>
        <ul className="clean-list">
          {workingPrinciples.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="about-info-panel">
        <h2>Our promise to donors</h2>
        <ul className="clean-list">
          {promise.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>

    <section className="section about-founder-section">
      <div className="about-section-title">
        <h2>Founded by IIT Kanpur alumni</h2>
        <p>
          Humanitarians was started by four IIT Kanpur alumni who wanted to make
          community giving more structured, transparent, and focused on
          self-reliance.
        </p>
      </div>
      <div className="founder-grid">
        {founders.map((founder) => (
          <article className="feature-card" key={founder.name}>
            <span aria-hidden="true">◇</span>
            <h3>{founder.name}</h3>
            <p>{founder.role}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="section about-values-panel">
      <div className="about-section-title">
        <h2>Our values</h2>
        <p>
          These values guide how cases are verified, supported, followed up, and
          reported publicly without compromising anyone’s dignity.
        </p>
      </div>
      <div className="pill-grid">
        {values.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
    </section>
    <CTASection />
  </main>
);
