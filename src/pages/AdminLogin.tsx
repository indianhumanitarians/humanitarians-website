import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { hasInviteOrRecoveryTokenInUrl } from "../services/supabaseAuth";

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const AdminLogin = () => {
  const { session, signIn, isConfigured } = useAdminAuth();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (hasInviteOrRecoveryTokenInUrl()) {
    return <Navigate to={`/admin/accept-invite${location.search}${location.hash}`} replace />;
  }

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);

    try {
      await signIn(email, password);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Could not sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container page admin-page admin-login-page">
      <section className="admin-auth-card">
        <span className="data-badge">Admin</span>
        <h1>Sign in</h1>
        {!isConfigured ? (
          <p className="admin-error">
            Supabase is not configured for this deployment.
          </p>
        ) : null}
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <Button disabled={!isConfigured || submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
};
