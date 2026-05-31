import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../components/common/Button";
import {
  fetchAdminProfile,
  getSessionFromInviteUrl,
  saveAdminSession,
  updateAdminPassword,
} from "../services/supabaseAuth";
import type { AdminSession } from "../types/admin";

export const AdminAcceptInvite = () => {
  const [session, setSession] = useState<AdminSession | undefined>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const loadInviteSession = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const inviteSession = await getSessionFromInviteUrl();
        if (isMounted) {
          setSession(inviteSession);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "This invite link could not be verified.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInviteSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      setError("This invite session is not available.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      await updateAdminPassword(session, password);
      const profile = await fetchAdminProfile(session);

      if (!profile || profile.role === "viewer") {
        throw new Error("This account is not authorized for the admin panel.");
      }

      saveAdminSession(session);
      window.location.assign("/admin");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not set your password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container page admin-page admin-login-page">
      <section className="admin-auth-card">
        <span className="data-badge">Admin invite</span>
        <h1>Set password</h1>
        {loading ? <p className="soft-status">Checking invite link...</p> : null}
        {session ? (
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              New password
              <input
                autoComplete="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label>
              Confirm password
              <input
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
            {error ? <p className="admin-error">{error}</p> : null}
            <Button disabled={submitting}>
              {submitting ? "Saving..." : "Set password"}
            </Button>
          </form>
        ) : null}
        {!loading && !session ? (
          <>
            {error ? <p className="admin-error">{error}</p> : null}
            <p className="admin-helper-text">
              Ask an owner to resend the invite if this link has expired or was
              already used.
            </p>
            <Button to="/admin/login" variant="secondary">
              Back to sign in
            </Button>
          </>
        ) : null}
      </section>
    </main>
  );
};
