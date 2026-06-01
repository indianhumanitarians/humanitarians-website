import { useState } from "react";
import { NavLink } from "react-router-dom";
import { adminLink, navLinks } from "../../data/site";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Primary navigation">
        <NavLink className="brand" to="/" onClick={() => setIsOpen(false)}>
          <img
            src="/images/logo-mark-transparent.png"
            alt=""
            className="brand-logo"
            aria-hidden="true"
          />
          <span>Humanitarians</span>
        </NavLink>
        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`nav-links${isOpen ? " is-open" : ""}`}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to={adminLink.to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {adminLink.label}
          </NavLink>
        </div>
      </nav>
    </header>
  );
};
