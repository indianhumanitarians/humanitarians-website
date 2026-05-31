import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export const ProtectedAdminRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading, isConfigured } = useAdminAuth();
  const location = useLocation();

  if (!isConfigured) {
    return (
      <main className="container page admin-page">
        <section className="admin-empty-panel">
          <h1>Admin backend is not configured</h1>
          <p>Add the Supabase URL and anon key to the site environment.</p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container page admin-page">
        <p className="soft-status">Loading admin session...</p>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};
