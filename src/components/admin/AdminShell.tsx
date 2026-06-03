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

const AdminTab = ({
  to,
  label,
  shortLabel,
  end = false,
}: {
  to: string;
  label: string;
  shortLabel: string;
  end?: boolean;
}) => (
  <NavLink to={to} end={end}>
    <span className="admin-tab-label-full">{label}</span>
    <span className="admin-tab-label-short">{shortLabel}</span>
  </NavLink>
);

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
        <AdminTab to="/admin" label="Dashboard" shortLabel="Dash" end />
        <AdminTab to="/admin/cases" label="Case Ledger" shortLabel="Ledger" end />
        <AdminTab to="/admin/cases/new" label="Add Case" shortLabel="Add Case" />
        <AdminTab
          to="/admin/testimonials"
          label="Mentorship Testimonials"
          shortLabel="Testimonials"
          end
        />
        <AdminTab
          to="/admin/testimonials/new"
          label="Add Testimonial"
          shortLabel="Add Test."
        />
        <AdminTab to="/admin/lists" label="Settings & Lists" shortLabel="Lists" />
        {profile?.role === "owner" ? (
          <AdminTab to="/admin/admins" label="Admins" shortLabel="Admins" />
        ) : null}
      </nav>
      {children}
    </main>
  );
};
