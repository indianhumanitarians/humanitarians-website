import { Link } from "react-router-dom";
import { contact } from "../../data/contact";
import { navLinks, site } from "../../data/site";

export const Footer = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div>
        <div className="footer-logo">
          <img src="/images/logo.jpeg" alt="" aria-hidden="true" />
          <span>Humanitarians</span>
        </div>
        <p className="footer-desc">{site.mission}</p>
        <p className="privacy-note">
          Public stats are aggregated and anonymized. No private recipient, donor,
          payment, or document details are published.
        </p>
        <div className="footer-contact">
          <p>Email: <a href={`mailto:${contact.email}`}>{contact.email}</a></p>
          <p>
            WhatsApp link available on{" "}
            <Link className="footer-inline-link" to="/donate">
              Donate / Join
            </Link>
          </p>
        </div>
      </div>
      <div className="footer-col">
        <h4>Pages</h4>
        {navLinks.slice(0, 5).map((link) => (
          <Link key={link.to} to={link.to}>{link.label}</Link>
        ))}
      </div>
      <div className="footer-col">
        <h4>Resources</h4>
        {[...navLinks.slice(5), { label: "Contact", to: "/contact" }].map((link) => (
          <Link key={link.to} to={link.to}>{link.label}</Link>
        ))}
      </div>
    </div>
    <div className="footer-bottom">
      <span>© 2026 Humanitarians. All rights reserved.</span>
      <span>Privacy-first public reporting</span>
    </div>
  </footer>
);
