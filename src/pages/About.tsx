import { Button } from "../components/common/Button";
import { CTASection } from "../components/common/CTASection";
import { SectionHeading } from "../components/common/SectionHeading";
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
    category: "Blue collar",
    title: "Livelihood support for families",
    text: "We help verified recipients with the initial capital, tools, stock, machines, or equipment needed to start or strengthen a small shop, service, or daily-earning work.",
  },
  {
    category: "White collar",
    title: "Skill support for job seekers",
    text: "We support useful course fees, IT learning, job readiness, and mentorship so a student or job seeker can improve skills and move toward stable employment.",
  },
  {
    category: "Mentorship",
    title: "Mentorship that improves outcomes",
    text: "Volunteers guide students and job seekers with resumes, interviews, communication, course selection, coding, data, IT, and career direction.",
  },
];
const workingPrinciples = [
  {
    id: "dignity",
    content: "Support should protect dignity, not create dependency.",
  },
  {
    id: "right-help",
    content: (
      <>
        The right help may be a sewing machine, shop stock, a tool kit,
        <br />a course, an e-rickshaw, or a mentor.
      </>
    ),
  },
  {
    id: "supporter",
    content: "Today’s recipient can become tomorrow’s supporter, InshaAllah.",
  },
];

export const About = () => (
  <main className="container page about-page">
    <SectionHeading
      title="About Humanitarians"
      content="Humanitarians is a charity community focused on verified Zakat and Sadaqah cases, with a strong emphasis on livelihood, skills, mentorship, and dignified self-reliance."
    />

    <section className="section about-editorial-section">
      <div className="about-work-header">
        <h2>An Initiative by IIT Kanpur Alumni</h2>
        <p>
          Humanitarians was started by IIT Kanpur alumni to make community
          giving more structured, transparent, and focused on self-reliance.
          What began as a small donor circle now helps verified families move
          from urgent need toward earning independently through capital, tools,
          assets, courses, job-readiness, and mentorship.
        </p>
        <div className="about-work-actions">
          <Button href={site.aboutProfileUrl} variant="secondary">
            Click here to know more about us.
          </Button>
          <Button to="/contact" variant="secondary">
            Contact us
          </Button>
        </div>
      </div>
      <div className="about-work-categories">
        {supportAreas.map((area) => (
          <article className="about-support-item" key={area.title}>
            <span>{area.category}</span>
            <h3>{area.title}</h3>
            <p>{area.text}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="section about-text-grid">
      <div className="about-text-block">
        <h2>Our approach</h2>
        <ul className="clean-list">
          {workingPrinciples.map((item) => (
            <li key={item.id}>{item.content}</li>
          ))}
        </ul>
      </div>
      <div className="about-text-block">
        <h2>Our promise to donors</h2>
        <ul className="clean-list">
          {promise.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>

    <section className="section about-values-section">
      <div className="about-text-block">
        <h2>Our values</h2>
        <p>
          These values guide how cases are verified, supported, followed up, and
          reported publicly without compromising anyone’s dignity.
        </p>
        <ul className="about-values-list">
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      </div>
    </section>
    <CTASection />
  </main>
);
