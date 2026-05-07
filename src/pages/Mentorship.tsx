import { Button } from "../components/common/Button";
import { CTASection } from "../components/common/CTASection";
import { SectionHeading } from "../components/common/SectionHeading";
import { contact } from "../data/contact";

const tracks = [
  {
    title: "Resume review",
    text: "Tighten profile, projects, experience, and role-specific presentation.",
  },
  {
    title: "Interview preparation",
    text: "Practice common questions, mock interviews, and confidence-building feedback.",
  },
  {
    title: "Coding, data, and IT guidance",
    text: "Get direction on fundamentals, projects, tools, and practical learning paths.",
  },
  {
    title: "English communication",
    text: "Improve spoken confidence, written clarity, and interview communication.",
  },
  {
    title: "Career direction",
    text: "Choose realistic next steps based on interest, background, and opportunity.",
  },
  {
    title: "Course selection",
    text: "Pick useful courses before donors or families spend money on training.",
  },
];

const audiences = [
  {
    title: "For students and job seekers",
    text: "Request focused help for study plans, job readiness, interviews, communication, and course direction.",
  },
  {
    title: "For mentors",
    text: "Volunteer practical guidance in short, focused sessions that can unlock confidence and employability.",
  },
  {
    title: "For donors",
    text: "Sponsor a course or learning support where mentorship can turn funding into a stronger outcome.",
  },
];

export const Mentorship = () => (
  <main className="container page">
    <SectionHeading
      title="Mentorship program"
      content="Livelihood, skills, and mentorship with volunteers from IITs, other colleges, and professional backgrounds."
    />
    <section className="section mentorship-audience-grid">
      {audiences.map(({ title, text }) => (
        <article className="mentorship-audience-card" key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </article>
      ))}
    </section>

    <section className="section mentor-tracks-panel">
      <div className="mentor-tracks-intro">
        <h2>Mentor tracks</h2>
        <p>
          Each track is designed to be practical and time-bound: one clear problem,
          useful feedback, and a next step the mentee can act on.
        </p>
      </div>
      <div className="mentor-track-grid">
        {tracks.map((track, index) => (
          <article className="mentor-track-card" key={track.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{track.title}</h3>
              <p>{track.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="section split-band">
      <div>
        <h2>How matching works</h2>
        <p>
          A volunteer reviews the request, matches it to an available mentor track, and keeps the guidance
          practical: a resume pass, a mock interview, a course recommendation, or a focused learning path.
        </p>
      </div>
      <div className="cta-actions">
        <Button href={contact.whatsapp.mentorVolunteer} variant="secondary">Join as Mentor</Button>
        <Button href={contact.whatsapp.menteeGroup} variant="secondary">Join as Mentee</Button>
        <Button to="/donate" variant="secondary">Sponsor a Course</Button>
      </div>
    </section>
    <CTASection />
  </main>
);
