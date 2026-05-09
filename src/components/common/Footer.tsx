import { Link } from "react-router-dom";
import { contact } from "../../data/contact";
import { navLinks, site } from "../../data/site";

export const Footer = () => (
  <footer className="site-footer">
    <div className="container footer-grid">
      <div>
        <h2>Humanitarians</h2>
        <p>{site.mission}</p>
      </div>
      <div>
        <h3>Quick links</h3>
        <ul className="footer-links">
          {[...navLinks, { label: "Contact", to: "/contact" }].map((link) => (
            <li key={link.to}>
              <Link to={link.to}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Contact</h3>
        <p>
          WhatsApp: New Members community link is available on{" "}
          <Link className="footer-inline-link" to="/donate">
            Donate / Join
          </Link>
          .
        </p>
        <p>Email: {contact.email}</p>
        <p className="footer-note">
          Privacy note: no private recipient, donor, payment, or document details are published.
        </p>
      </div>
    </div>
  </footer>
);
