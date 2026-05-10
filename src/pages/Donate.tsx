import { Button } from "../components/common/Button";
import { CopyButton } from "../components/common/CopyButton";
import { PrivacyNote } from "../components/common/PrivacyNote";
import { SectionHeading } from "../components/common/SectionHeading";
import { contact } from "../data/contact";
import type { MouseEvent } from "react";

const openUpiChooser =
  (upiIntentLink: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!/Android/i.test(window.navigator.userAgent)) {
      return;
    }

    event.preventDefault();
    window.location.href = upiIntentLink;
  };

export const Donate = () => (
  <main className="container page">
    <SectionHeading
      title="Donate / Join"
      content="Support a livelihood, sponsor a course, join the Humanitarians WhatsApp community, or use the public Zakat and Sadaqah QR details below."
    />

    <section className="section donate-payment-section">
      <div className="donate-section-heading">
        <h2>Donate</h2>
        <p>
          Choose the correct payment route based on your intended fund type.
        </p>
      </div>
      <div className="payment-option-grid">
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
            <div className="upi-id-line">
              <span>UPI ID: {payment.upiId}</span>
              <CopyButton
                value={payment.upiId}
                label={`Copy ${payment.fundType} UPI ID`}
              />
            </div>
            <div className="upi-pay-action">
              <a
                className="button button-secondary"
                href={payment.upiLink}
                onClick={openUpiChooser(payment.upiIntentLink)}
              >
                Click here to pay with any UPI app
              </a>
              <div className="upi-app-options" aria-label={`${payment.fundType} UPI app shortcuts`}>
                {payment.upiAppLinks.map((appLink) => (
                  <a href={appLink.href} key={appLink.label}>
                    {appLink.label}
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}
        <article className="payment-card bank-card">
          <span className="payment-chip">Bank transfer</span>
          <h2>Bank transfer</h2>
          <p>
            Use bank transfer only after confirming the intended fund type with
            the team.
          </p>
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
      </div>
    </section>

    <section className="section join-section">
      <div className="donate-section-heading">
        <h2>Join</h2>
        <p>
          Join the Humanitarians New Members group to stay connected with public
          updates and donor coordination.
        </p>
      </div>
      <article className="payment-card community-card">
        <h2>Join the New Members group</h2>
        <img
          src={contact.qrAssets.whatsappNewMembers}
          alt="WhatsApp QR code for joining the Humanitarians New Members group"
          className="whatsapp-qr-image"
        />
        <p>
          Scan the QR code or use the button below to join the Humanitarians
          WhatsApp community.
        </p>
        <Button href={contact.whatsapp.newMembersGroup} variant="secondary">
          Join WhatsApp group
        </Button>
      </article>
    </section>
    <section className="section cta-list">
      <Button href={contact.whatsapp.newMembersGroup} variant="secondary">
        Join WhatsApp donor community
      </Button>
      <Button href={contact.links.livelihoodSponsor} variant="secondary">
        Sponsor a livelihood case
      </Button>
      <Button href={contact.links.courseSponsor} variant="secondary">
        Sponsor a course
      </Button>
      <Button href={contact.links.sadaqahSupport} variant="secondary">
        Support Sadaqah cases
      </Button>
      <Button href={contact.links.caseReferral} variant="secondary">
        Refer a case
      </Button>
    </section>
    <PrivacyNote>
      Do not send sensitive documents, payment IDs, recipient documents, or
      private notes through public forms or public links.
    </PrivacyNote>
  </main>
);
