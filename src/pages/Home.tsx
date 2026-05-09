import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CaseStoryCard } from "../components/cases/CaseStoryCard";
import { Button } from "../components/common/Button";
import { CTASection } from "../components/common/CTASection";
import { useCaseStories } from "../hooks/useCaseStories";
import { usePublicStats } from "../hooks/usePublicStats";
import { formatRupees, getMetricValue, toFiniteNumber } from "../utils";

const modelCards = [
  {
    icon: "✓",
    title: "Verified cases",
    text: "Every recipient is assessed by the team before any commitment. Zakat and Sadaqah are tracked in separate, public ledgers.",
  },
  {
    icon: "🔧",
    title: "Tools & assets",
    text: "We fund the missing step: capital, tools, machines, stock, courses, or job-readiness - whatever enables income.",
  },
  {
    icon: "🎓",
    title: "IIT mentorship",
    text: "Mentors from IITs, colleges, and professional backgrounds guide students toward stable, dignified employment.",
  },
  {
    icon: "▦",
    title: "Public reporting",
    text: "Monthly aggregated reports published openly - no recipient names, IDs, or payment details ever disclosed.",
  },
];

const mentorshipSkills = [
  { icon: "📄", label: "Resume review" },
  { icon: "🎤", label: "Interview prep" },
  { icon: "💬", label: "Communication" },
  { icon: "💻", label: "Coding" },
  { icon: "📊", label: "Data skills" },
  { icon: "🧭", label: "Career direction" },
  { icon: "📚", label: "Course selection" },
  { icon: "🌐", label: "IT learning" },
];

const transparencyCards = [
  {
    icon: "📋",
    title: "Verified cases only",
    text: "Each case is individually assessed before any funds are committed. No anonymous referrals, no unchecked disbursements.",
  },
  {
    icon: "⚖",
    title: "Zakat & Sadaqah separated",
    text: "Funds are never mixed. Zakat and Sadaqah are tracked separately so donors can give with clarity.",
  },
  {
    icon: "🔒",
    title: "Privacy first",
    text: "No recipient names, phone numbers, Aadhaar, donor details, or payment IDs are ever published. Dignity is non-negotiable.",
  },
];

const HomeHeroStats = () => {
  const { stats, source } = usePublicStats();
  const metric = (key: string) => getMetricValue(stats.impactSummary, key);
  const community = String(metric("active_donor_community"));
  const cases = String(metric("total_public_cases"));
  const livelihoodCases = String(metric("livelihood_cases"));
  const skillCases = String(metric("skill_education_cases"));

  return (
    <div className="hero-card-stack">
      <div className="stat-card-hero">
        <div className="stat-card-kicker">Impact at a glance</div>
        <div className="stat-row">
          <div className="stat-block">
            <div className="snum">{community}</div>
            <div className="slabel">Donor community</div>
          </div>
          <div className="stat-block">
            <div className="snum">{cases}</div>
            <div className="slabel">Cases tracked</div>
          </div>
        </div>
      </div>
      <div className="mini-card">
        <div className="mini-card-icon">🏪</div>
        <div className="mini-card-text">
          <strong>{livelihoodCases} Livelihood cases</strong>
          Shops, sewing, e-rickshaws, tools & more
        </div>
      </div>
      <div className="mini-card">
        <div className="mini-card-icon">📚</div>
        <div className="mini-card-text">
          <strong>{skillCases} Skill & education cases</strong>
          Courses, IT, job-readiness & mentorship
        </div>
      </div>
      <div className="mini-card">
        <div className="mini-card-icon">🔒</div>
        <div className="mini-card-text">
          <strong>Privacy-first reporting</strong>
          No private names, IDs, or payment details shared
        </div>
      </div>
      <p className={`hero-source-pill ${source}`}>
        {source === "live"
          ? "Live public stats"
          : source === "partial"
            ? "Live data partial"
            : "Live data unavailable"}
      </p>
    </div>
  );
};

const formatCompactRupees = (value: string | number): string => {
  const amount = toFiniteNumber(value);

  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(lakhs >= 10 || Number.isInteger(lakhs) ? 0 : 1)}L`;
  }

  return amount > 0 ? formatRupees(amount) : String(value);
};

const HomeMarquee = () => {
  const { stats } = usePublicStats();
  const metric = (key: string) => getMetricValue(stats.impactSummary, key);
  const hasStats = stats.impactSummary.length > 0;
  const community = String(metric("active_donor_community"));
  const cases = String(metric("total_public_cases"));
  const disbursed = formatCompactRupees(metric("total_amount_disbursed"));
  const marqueeItems = [
    "Verified Cases",
    "Zakat Tracked Separately",
    "Monthly Public Reports",
    "Livelihood Support",
    "Skill Sponsorship",
    "IIT Kanpur Founded",
    ...(hasStats
      ? [`${community} Donors`, `${cases} Cases`, `${disbursed} Disbursed`]
      : []),
    "Privacy Protected",
  ];

  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-inner">
        {[...marqueeItems, ...marqueeItems].map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
};

const HomeImpactSnapshot = () => {
  const { stats, source } = usePublicStats();
  const metric = (key: string) => getMetricValue(stats.impactSummary, key);
  const amount = toFiniteNumber(metric("total_amount_disbursed"));
  const zakatAmount = toFiniteNumber(metric("zakat_amount_disbursed"));
  const sadaqahAmount = toFiniteNumber(metric("sadaqah_amount_disbursed"));
  const allocationTotal = Math.max(amount, zakatAmount + sadaqahAmount);
  const otherAmount = Math.max(
    allocationTotal - zakatAmount - sadaqahAmount,
    0,
  );
  const allocationItems = [
    {
      className: "zakat",
      label: "Zakat",
      amount: zakatAmount,
      percent: allocationTotal > 0 ? (zakatAmount / allocationTotal) * 100 : 0,
    },
    {
      className: "sadaqah",
      label: "Sadaqah",
      amount: sadaqahAmount,
      percent:
        allocationTotal > 0 ? (sadaqahAmount / allocationTotal) * 100 : 0,
    },
    {
      className: "others",
      label: "Others",
      amount: otherAmount,
      percent: allocationTotal > 0 ? (otherAmount / allocationTotal) * 100 : 0,
    },
  ];
  const hasStats = stats.impactSummary.length > 0 || stats.monthly.length > 0;
  const metrics = [
    {
      label: "Active donor community",
      value: String(metric("active_donor_community")),
    },
    {
      label: "Public cases tracked",
      value: String(metric("total_public_cases")),
    },
    {
      label: "Livelihood cases",
      value: String(metric("livelihood_cases")),
    },
    {
      label: "Total donation",
      value:
        amount > 0
          ? formatRupees(amount)
          : String(metric("total_amount_disbursed")),
      variant: "gold",
    },
  ];

  return (
    <>
      <div className="impact-heading">
        <div className="impact-title-line">
          <div className="tag">Impact snapshot</div>
          <p className={`impact-source-pill ${source}`}>
            {source === "live"
              ? "Live stats"
              : source === "partial"
                ? "Live data partial"
                : "Live data unavailable"}
          </p>
        </div>
        <h2 className="h2">
          Numbers that <em>mean something.</em>
        </h2>
        <p className="lead">
          Public signals before the details - community size, case tracking, and
          how funds were used. Updated monthly.
        </p>
      </div>
      <div className="impact-top">
        {!hasStats ? (
          <p className="empty-state">
            Live public stats are not available right now.
          </p>
        ) : null}
        <div>
          <div className="impact-stats">
            {metrics.map((item) => (
              <article
                className={`istat ${item.variant ?? ""}`}
                key={item.label}
              >
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
          <div className="fund-bar-card">
            <h3>Fund Allocation</h3>
            <p>
              How total support of {formatRupees(allocationTotal)} was
              distributed across fund types
            </p>
            <div className="fund-stack-bar" aria-hidden="true">
              {allocationItems.map((item) => (
                <i
                  className={`fund-stack-segment ${item.className}`}
                  key={item.label}
                  style={{ width: `${item.percent}%` }}
                />
              ))}
            </div>
            <div className="fund-stack-legend">
              {allocationItems.map((item) => (
                <span
                  className={`fund-legend-item ${item.className}`}
                  key={item.label}
                >
                  <i aria-hidden="true" />
                  <strong>{item.label}</strong> - {formatRupees(item.amount)} (
                  {item.percent.toFixed(1)}%)
                </span>
              ))}
            </div>
          </div>
        </div>
        <article className="chart-card home-impact-chart">
          <h3>Families helped each month</h3>
          <p>Cases tracked publicly</p>
          <div className="chart-wrap" aria-hidden="true">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={stats.monthly.filter((row) => row.total_cases > 0)}
                margin={{ top: 12, right: 6, left: -22, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#efe7db" />
                <XAxis
                  dataKey="period_label"
                  tick={{ fontSize: 10, fill: "#8a8178" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#8a8178" }}
                />
                <Tooltip cursor={{ fill: "rgba(26,92,56,0.08)" }} />
                <Bar
                  dataKey="total_cases"
                  name="Families helped"
                  fill="#1a5c38"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card-link">
            <Link to="/reports">View full reports →</Link>
          </div>
        </article>
      </div>
    </>
  );
};

export const Home = () => {
  const { stories, loading: storiesLoading } = useCaseStories();
  const featuredStories = stories.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <div className="eyebrow">
            <span className="eyebrow-bar" />
            Community-driven giving
          </div>
          <h1 className="hero-h1">
            From support
            <br />
            to <em>self-reliance.</em>
          </h1>
          <p className="hero-p">
            A charity community supporting verified Zakat and Sadaqah cases
            through livelihoods, skills, and mentorship - helping families stand
            on their own feet.
          </p>
          <div className="hero-actions hero-btns">
            <Button to="/donate" variant="primary">
              Join Donor Community
            </Button>
            <Button to="/case-stories" variant="secondary">
              View Our Work
            </Button>
            <Button to="/contact" variant="secondary">
              Refer a Case
            </Button>
          </div>
          <div className="hero-tagline">
            A sewing machine, a course, a tool kit, an e-rickshaw, a mentor.
            <br />
            The right support can become a family's turning point.
          </div>
        </div>
        <div className="hero-right">
          <HomeHeroStats />
        </div>
      </section>

      <HomeMarquee />

      <main>
        <section className="section stories-section">
          <div className="s-inner">
            <div className="tag">Case Stories</div>
            <h2 className="h2">
              Real support. <em>Real turning points.</em>
            </h2>
            <p className="lead">
              See the support - not private details. Every case is verified,
              anonymized, and reported publicly with dignity.
            </p>
            {storiesLoading ? (
              <p className="soft-status">Loading public case stories...</p>
            ) : null}
            {featuredStories.length > 0 ? (
              <>
                <div className="case-grid stories-grid">
                  {featuredStories.map((story) => (
                    <CaseStoryCard key={story.case_id} story={story} />
                  ))}
                </div>
                <p className="stories-cta">
                  <Button to="/case-stories" variant="primary">
                    View case stories
                  </Button>
                </p>
              </>
            ) : !storiesLoading ? (
              <p className="empty-state">
                No published case stories are available yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="section impact-section">
          <div className="s-inner">
            <HomeImpactSnapshot />
          </div>
        </section>

        <section className="section model-section">
          <div className="s-inner">
            <div className="tag">Our model</div>
            <h2 className="h2">
              Built for <em>lasting impact,</em> not just relief.
            </h2>
            <p className="lead">
              Livelihood, skills, and mentorship for people to stand on their
              own feet - not just receive one-time aid.
            </p>
            <div className="model-grid">
              {modelCards.map((card) => (
                <article className="model-card" key={card.title}>
                  <span className="model-icon">{card.icon}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section mentor-section">
          <div className="s-inner mentor-inner">
            <div>
              <div className="tag">Mentorship</div>
              <h2 className="h2">
                Guidance that <em>changes directions.</em>
              </h2>
              <p className="lead">
                Volunteers from IITs, colleges, and professional backgrounds
                help students and job seekers move with confidence - at no cost
                to them.
              </p>
              <div className="mentor-skills">
                {mentorshipSkills.map((skill) => (
                  <span className="skill-chip" key={skill.label}>
                    <span aria-hidden="true">{skill.icon}</span>
                    {skill.label}
                  </span>
                ))}
              </div>
              <div className="mentor-action">
                <Button to="/mentorship" variant="primary">
                  Explore Mentorship
                </Button>
              </div>
            </div>
            <div className="mentor-visual">
              <blockquote className="mentor-quote">
                "The right guidance at the right moment can change a trajectory
                entirely."
              </blockquote>
              <p>
                Mentors help students choose the right courses, prepare for
                interviews, build communication skills, and find their first
                steps in a career. All mentorship is voluntary - from people who
                want to give back.
              </p>
              <div className="mentor-stat-row">
                <div className="m-stat">
                  <strong>4</strong>
                  <span>Skill cases</span>
                </div>
                <div className="m-stat">
                  <strong>IIT</strong>
                  <span>Founded by alumni</span>
                </div>
                <div className="m-stat">
                  <strong>Free</strong>
                  <span>For recipients</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section transp-section">
          <div className="s-inner">
            <div className="tag">Transparency</div>
            <h2 className="h2">
              You deserve to know <em>where it goes.</em>
            </h2>
            <p className="lead">
              Every rupee tracked. Every case anonymized. Every report
              published.
            </p>
            <div className="transp-grid">
              {transparencyCards.map((card) => (
                <article className="transp-card" key={card.title}>
                  <span className="transp-icon">{card.icon}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
            <div className="transp-action">
              <Button to="/reports" variant="primary">
                View monthly reports
              </Button>
            </div>
          </div>
        </section>

        <CTASection
          title={
            <>
              Today's recipient becomes
              <br />
              <em>tomorrow's supporter,</em> InshaAllah.
            </>
          }
          text="Join the donor community, refer a verified case, or volunteer your skills as a mentor. Every contribution is tracked with care."
        />
      </main>
    </>
  );
};
