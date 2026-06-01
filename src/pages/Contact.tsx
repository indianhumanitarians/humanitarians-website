import { Button } from "../components/common/Button";
import { PrivacyNote } from "../components/common/PrivacyNote";
import { SectionHeading } from "../components/common/SectionHeading";
import { usePublicSiteSettings } from "../hooks/usePublicSiteSettings";

export const Contact = () => {
  const { contact, error, loading } = usePublicSiteSettings();

  return (
    <main className="container page">
    <SectionHeading
      title="Contact"
      content="Refer a case, volunteer, or reach the donor community. Start with basic public-safe details."
    />
    {loading ? (
      <p className="soft-status">Loading public contact settings...</p>
    ) : null}
    {error ? (
      <p className="stats-error">Public contact settings could not be loaded.</p>
    ) : null}
    {contact ? (
      <>
    <section className="section three-col contact-card-grid">
      <article className="feature-card">
        <h2>WhatsApp</h2>
        <p>Join the New Members group to connect with the Humanitarians donor community.</p>
        <Button href={contact.whatsapp.newMembersGroup} variant="secondary">Open WhatsApp</Button>
      </article>
      <article className="feature-card">
        <h2>Email</h2>
        <p>{contact.email}</p>
        <Button href={`mailto:${contact.email}`} variant="secondary">Send Email</Button>
      </article>
      <article className="feature-card">
        <h2>Mentorship</h2>
        <p>Volunteer as a mentor or request guidance for a student or job seeker.</p>
        <Button href={contact.whatsapp.mentorVolunteer} variant="secondary">Volunteer</Button>
      </article>
    </section>
    <section className="section split-band referral-privacy-note">
      <div>
        <h2>Help a needy family</h2>
        <p>Please do not send sensitive documents until a Humanitarians volunteer confirms the secure process.</p>
      </div>
      <Button href={contact.links.caseReferral} variant="secondary">Refer a Case</Button>
    </section>
      <PrivacyNote>No phone numbers, addresses, ID documents, donor names, or private case notes are published on the website. Public payment details are limited to the editable donation information shown on the Donate / Join page.</PrivacyNote>
      </>
    ) : null}
    </main>
  );
};
