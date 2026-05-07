import { Button } from "../components/common/Button";
import { PrivacyNote } from "../components/common/PrivacyNote";
import { SectionHeading } from "../components/common/SectionHeading";
import { contact } from "../data/contact";

export const Donate = () => (
  <main className="container page">
    <SectionHeading
      title="Donate / Join"
      content="Support a livelihood, sponsor a course, join the Humanitarians WhatsApp community, or use the public Zakat and Sadaqah QR details below."
    />
    <section className="section donate-grid">
      <article className="payment-card community-card">
        <h2>Join the New Members group</h2>
        <img
          src={contact.qrAssets.whatsappNewMembers}
          alt="WhatsApp QR code for joining the Humanitarians New Members group"
          className="whatsapp-qr-image"
        />
        <p>Scan the QR code or use the button below to join the Humanitarians WhatsApp community.</p>
        <Button href={contact.whatsapp.newMembersGroup} variant="secondary">Join WhatsApp group</Button>
      </article>
    </section>

    <section className="section donate-payment-section">
      <div className="donate-section-heading">
        <h2>Donate</h2>
        <p>Choose the correct QR based on your intended fund type.</p>
      </div>
      <div className="upi-card-grid">
        {contact.upiPayments.map((payment) => (
          <article className="payment-card upi-card" key={payment.id}>
            <span className="payment-chip">{payment.fundType}</span>
            <h2>{payment.displayName}</h2>
            <p>{payment.purpose}</p>
            <img
              src={payment.qrImage}
              alt={`${payment.fundType} UPI QR for ${payment.displayName}`}
              className="upi-qr-image"
            />
            <p className="upi-id-line">UPI ID: {payment.upiId}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="section donate-grid">
      <article className="payment-card">
        <h2>Bank transfer</h2>
        <dl>
          <dt>Account name</dt>
          <dd>{contact.bank.accountName}</dd>
          <dt>Account number</dt>
          <dd>{contact.bank.accountNumber}</dd>
          <dt>IFSC</dt>
          <dd>{contact.bank.ifsc}</dd>
          <dt>Branch</dt>
          <dd>{contact.bank.branch}</dd>
        </dl>
      </article>
    </section>
    <section className="section cta-list">
      <Button href={contact.whatsapp.newMembersGroup} variant="secondary">Join WhatsApp donor community</Button>
      <Button href={contact.links.livelihoodSponsor} variant="secondary">Sponsor a livelihood case</Button>
      <Button href={contact.links.courseSponsor} variant="secondary">Sponsor a course</Button>
      <Button href={contact.links.sadaqahSupport} variant="secondary">Support Sadaqah cases</Button>
      <Button href={contact.links.caseReferral} variant="secondary">Refer a case</Button>
    </section>
    <PrivacyNote>
      Do not send sensitive documents, payment IDs, recipient documents, or private notes through public forms or public links.
    </PrivacyNote>
  </main>
);
