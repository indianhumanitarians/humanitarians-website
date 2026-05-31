import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "../common/Button";
import { useAdminAuth } from "../../hooks/useAdminAuth";

interface AdminShellProps {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const AdminShell = ({
  title,
  eyebrow = "Private workspace",
  actions,
  children,
}: AdminShellProps) => {
  const { profile, signOut } = useAdminAuth();

  return (
    <main className="container page admin-page">
      <section className="admin-shell-header">
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{profile?.email}</p>
        </div>
        <div className="admin-header-actions">
          {actions}
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </section>
      <nav className="admin-tabs" aria-label="Admin navigation">
        <NavLink to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink to="/admin/cases">Case Ledger</NavLink>
        <NavLink to="/admin/testimonials">Mentorship Testimonials</NavLink>
        <NavLink to="/admin/lists">Manage Lists</NavLink>
        {profile?.role === "owner" ? <NavLink to="/admin/admins">Admins</NavLink> : null}
      </nav>
      {children}
    </main>
  );
};
