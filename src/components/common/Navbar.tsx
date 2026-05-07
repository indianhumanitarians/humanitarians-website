import { useState } from "react";
import { NavLink } from "react-router-dom";
import { navLinks } from "../../data/site";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Primary navigation">
        <NavLink className="brand" to="/" onClick={() => setIsOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            H
          </span>
          Humanitarians
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
        </div>
      </nav>
    </header>
  );
};
