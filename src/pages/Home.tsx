import { Link } from "react-router-dom";
import { CaseStoryCard } from "../components/cases/CaseStoryCard";
import { Button } from "../components/common/Button";
import { SectionHeading } from "../components/common/SectionHeading";
import { fallbackCaseStories } from "../data/statsFallback";
import { usePublicStats } from "../hooks/usePublicStats";
import { formatRupees, getMetricValue, toFiniteNumber } from "../utils";

const operatingSteps = [
  "Receive or identify a case",
  "Verify need and eligibility",
  "Decide whether Zakat, Sadaqah, or mixed support is appropriate",
  "Design a livelihood, skill, or emergency support plan",
  "Fund tools, assets, courses, or business inputs",
  "Follow up where possible",
  "Share aggregated monthly reports",
];

const HomeImpactDelivered = () => {
  const { stats, source } = usePublicStats();
  const metric = (key: string) => getMetricValue(stats.impactSummary, key);
  const amount = toFiniteNumber(metric("total_amount_disbursed"));
  const zakatAmount = toFiniteNumber(metric("zakat_amount_disbursed"));
  const sadaqahAmount = toFiniteNumber(metric("sadaqah_amount_disbursed"));
  const metrics = [
    {
      label: "Cases supported",
      value: String(metric("total_public_cases")),
    },
    {
      label: "Support delivered",
      value: amount > 0 ? formatRupees(amount) : String(metric("total_amount_disbursed")),
    },
    {
      label: "Livelihood cases",
      value: String(metric("livelihood_cases")),
    },
    {
      label: "Skill / education cases",
      value: String(metric("skill_education_cases")),
    },
    {
      label: "Active donor community",
      value: String(metric("active_donor_community")),
    },
    {
      label: "Zakat / Sadaqah delivered",
      value:
        zakatAmount > 0 || sadaqahAmount > 0
          ? `${formatRupees(zakatAmount)} / ${formatRupees(sadaqahAmount)}`
          : `${metric("zakat_amount_disbursed")} / ${metric("sadaqah_amount_disbursed")}`,
    },
  ];

  return (
    <>
      <div className="home-impact-metrics">
        {metrics.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
      <p className={`impact-source-pill ${source}`}>
        {source === "live"
          ? "Live public stats"
          : source === "partial"
            ? "Live with saved backup"
            : "Saved public summary"}
      </p>
    </>
  );
};

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
            <Button to="/donate" variant="primary">
              Join Donor Community
            </Button>
            <Button to="/case-stories" variant="secondary">View Our Work</Button>
            <Button to="/contact" variant="secondary">
              Refer a Case
            </Button>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Public-safe images of livelihood and skill support"
        >
          <img
            src="/images/cases/case-cs-001-image-01.jpeg"
            alt="Sewing livelihood support arranged for a public case story"
            className="hero-photo hero-photo-main"
          />
          <img
            src="/images/cases/business-supplies.svg"
            alt="Business supplies and stock support"
            className="hero-photo hero-photo-small top"
          />
          <img
            src="/images/cases/course-support.svg"
            alt="Course sponsorship and skill support"
            className="hero-photo hero-photo-small bottom"
          />
          <div className="hero-caption">
            A sewing machine, a course, a tool kit, an e-rickshaw, a mentor.
          </div>
        </div>
      </div>
    </section>

    <main>
      <section className="container section home-impact-section">
        <SectionHeading
          title="Impact delivered"
          content="A single view of public impact: cases supported, funds delivered, livelihood support, skills support, donor community, and Zakat/Sadaqah delivery."
        />
        <HomeImpactDelivered />
        <p className="section-link">
          <Link to="/reports">View full public reports</Link>
        </p>
      </section>

      <section className="container section">
        <SectionHeading
          title="How we operate"
          content="The same operating model from case intake to public reporting, shown as a step-by-step flow."
        />
        <div className="home-operating-flow">
          {operatingSteps.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

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

      <section className="container section home-mentorship-section">
        <div className="section-action-heading">
          <SectionHeading
            title="Mentorship program"
            content="We provide mentorship to students and job seekers so they can move toward jobs with stronger resumes, interview preparation, communication, coding, data, IT guidance, and practical career direction."
          />
          <Button to="/mentorship" variant="secondary">
            Explore Mentorship
          </Button>
        </div>
      </section>

      <div className="container section home-cta-section">
        <section className="home-zariyah-block">
          <div className="section-action-heading">
            <div className="section-heading">
              <h2>
                <span className="section-heading-main">
                  Be a Zariyah for someone
                </span>
              </h2>
              <span className="section-heading-support">
                Today’s recipient becomes tomorrow’s supporter, InshaAllah.
                Join the donor community, refer a verified case, or volunteer
                your skills as a mentor.
              </span>
            </div>
            <div className="cta-actions">
              <Button to="/donate" variant="secondary">
                Donate / Join
              </Button>
              <Button to="/contact" variant="secondary">
                Refer a Case
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </>
);
