import { CTASection } from "../components/common/CTASection";
import { SectionHeading } from "../components/common/SectionHeading";

const steps = [
  "Receive or identify a case",
  "Verify need and eligibility",
  "Decide whether Zakat, Sadaqah, or mixed support is appropriate",
  "Design a livelihood, skill, or emergency support plan",
  "Fund tools, assets, courses, or business inputs",
  "Follow up where possible",
  "Share aggregated monthly reports",
];

export const OurModel = () => (
  <main className="container page">
    <SectionHeading
      title="Our model"
      content="We support people in a way that helps them stand on their own feet, with a focus on livelihood generation instead of blind one-time giving."
    />
    <section className="timeline">
      {steps.map((step, index) => (
        <article key={step}>
          <span>{index + 1}</span>
          <h2>{step}</h2>
        </article>
      ))}
    </section>
    <section className="section split-band">
      <div>
        <h2>Support designed for earning, not dependency.</h2>
        <p>
          Sewing machines, e-rickshaw or auto livelihood support, shop setup, tool kits, equipment,
          courses, IT support, education support, mentorship, and urgent Sadaqah cases are evaluated by
          what will most responsibly help the recipient move forward.
        </p>
      </div>
    </section>
    <CTASection />
  </main>
);
