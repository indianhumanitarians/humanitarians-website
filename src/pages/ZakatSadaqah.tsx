import { FAQAccordion } from "../components/common/FAQAccordion";
import { SectionHeading } from "../components/common/SectionHeading";
import { zakatFaq } from "../data/faq";
import { site } from "../data/site";

export const ZakatSadaqah = () => (
  <main className="container page">
    <SectionHeading
      title="Zakat & Sadaqah"
      content="Separate tracking, careful eligibility review, and clear reporting for eligible Zakat recipients and broader Sadaqah needs."
    />
    <section className="section two-col">
      <article className="feature-card">
        <h2>Zakat handling</h2>
        <p>
          Zakat eligibility is reviewed by the Humanitarians verification team. Livelihood cases may be
          Zakat, Sadaqah, or mixed depending on eligibility and donor intent.
        </p>
      </article>
      <article className="feature-card">
        <h2>Sadaqah handling</h2>
        <p>
          Sadaqah supports broader charitable needs, urgent relief, education support, mentorship-linked
          courses, community support, and livelihood cases where Sadaqah is appropriate.
        </p>
      </article>
    </section>
    <section className="section zakat-faq-section">
      <div className="zakat-faq-heading">
        <h2>Common questions</h2>
        <p>
          Short answers on eligibility, fund separation, and how public
          reporting protects donor intent and recipient dignity.
        </p>
      </div>
      <FAQAccordion items={zakatFaq} />
    </section>
    <section className="disclaimer">
      <p>{site.scholarDisclaimer}</p>
    </section>
  </main>
);
