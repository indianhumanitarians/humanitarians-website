import { Button } from "./Button";
import type { ReactNode } from "react";
import { usePublicSiteSettings } from "../../hooks/usePublicSiteSettings";

interface CTASectionProps {
  title?: ReactNode;
  text?: string;
}

export const CTASection = ({
  title = <>Today's recipient becomes<br /><em>tomorrow's supporter,</em> InshaAllah.</>,
  text = "Join the donor community, refer a verified case, or volunteer your skills as a mentor. Every contribution is tracked with care.",
}: CTASectionProps) => {
  const { contact } = usePublicSiteSettings();

  return (
    <section className="cta-band cta-section">
      <div className="cta-glow" aria-hidden="true" />
      <div className="cta-content">
        <div className="tag">Join us</div>
        <h2 className="h2">{title}</h2>
        <p className="cta-sub">{text}</p>
        <div className="cta-actions cta-btns">
          <Button to="/donate" variant="primary">Donate / Join</Button>
          <Button
            href={contact?.links.caseReferral}
            variant="secondary"
          >
            Refer a Case
          </Button>
        </div>
      </div>
    </section>
  );
};
