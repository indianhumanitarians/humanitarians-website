import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  to?: string;
  variant?: ButtonVariant;
  ariaLabel?: string;
  disabled?: boolean;
  download?: boolean | string;
  onClick?: () => void;
}

export const Button = ({
  children,
  href,
  to,
  variant = "primary",
  ariaLabel,
  disabled = false,
  download,
  onClick,
}: ButtonProps) => {
  const className = `button button-${variant}${disabled ? " is-disabled" : ""}`;
  const isExternalHref = href ? /^https?:\/\//.test(href) : false;
  const isPlaceholderHref = href === "#";

  if (to) {
    return (
      <Link className={className} to={to} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  if (href && !disabled && !isPlaceholderHref) {
    return (
      <a
        className={className}
        href={href}
        aria-label={ariaLabel}
        target={isExternalHref ? "_blank" : undefined}
        rel={isExternalHref ? "noopener noreferrer" : undefined}
        download={download}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={className} aria-label={ariaLabel} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};
