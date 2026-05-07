import { Button } from "./Button";

interface CTASectionProps {
  title?: string;
  text?: string;
}

export const CTASection = ({
  title = "Today’s recipient becomes tomorrow’s supporter, InshaAllah.",
  text = "Join the donor community, refer a verified case, or volunteer your skills as a mentor.",
}: CTASectionProps) => (
  <section className="cta-band">
    <div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
    <div className="cta-actions">
      <Button to="/donate" variant="secondary">Donate / Join</Button>
      <Button to="/contact" variant="secondary">
        Refer a Case
      </Button>
    </div>
  </section>
);
