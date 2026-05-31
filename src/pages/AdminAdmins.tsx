import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { useAdminAuth } from "../hooks/useAdminAuth";
import {
  fetchAdminProfiles,
  inviteAdmin,
  removeAdminAccess,
  updateAdminRole,
  type AdminWritableRole,
} from "../services/adminUsers";
import type { AdminProfile } from "../types/admin";

const roleOptions: AdminWritableRole[] = ["admin", "owner"];

const formatDate = (value: string | undefined): string =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "-";

const sortProfiles = (profiles: AdminProfile[]): AdminProfile[] =>
  [...profiles].sort((left, right) => {
    if (left.role === "owner" && right.role !== "owner") {
      return -1;
    }
    if (left.role !== "owner" && right.role === "owner") {
      return 1;
    }
    return left.email.localeCompare(right.email);
  });

export const AdminAdmins = () => {
  const { session, profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminWritableRole>("admin");
  const [loading, setLoading] = useState(Boolean(session && isOwner));
  const [actionKey, setActionKey] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const ownerCount = useMemo(
    () => profiles.filter((item) => item.role === "owner").length,
    [profiles],
  );

  const loadProfiles = useCallback(async () => {
    if (!session || !isOwner) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      setProfiles(sortProfiles(await fetchAdminProfiles(session.accessToken)));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load admins.",
      );
    } finally {
      setLoading(false);
    }
  }, [isOwner, session]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const withAction = async (key: string, action: () => Promise<void>) => {
    setActionKey(key);
    setError(undefined);
    setNotice(undefined);

    try {
      await action();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Action failed.",
      );
    } finally {
      setActionKey(undefined);
    }
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !isOwner) {
      setError("Only owners can invite admins.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    await withAction("invite", async () => {
      await inviteAdmin(session.accessToken, {
        email: normalizedEmail,
        role,
      });
      setEmail("");
      setRole("admin");
      await loadProfiles();
      setNotice(`Invite sent to ${normalizedEmail}.`);
    });
  };

  const handleRoleChange = async (
    adminProfile: AdminProfile,
    nextRole: AdminWritableRole,
  ) => {
    if (!session || !isOwner || nextRole === adminProfile.role) {
      return;
    }
    if (adminProfile.user_id === session.user.id) {
      setError("You cannot change your own owner role from this screen.");
      return;
    }
    if (adminProfile.role === "owner" && ownerCount <= 1) {
      setError("At least one owner must remain.");
      return;
    }

    await withAction(`role:${adminProfile.user_id}`, async () => {
      await updateAdminRole(session.accessToken, adminProfile.user_id, nextRole);
      await loadProfiles();
      setNotice(`${adminProfile.email} is now ${nextRole}.`);
    });
  };

  const handleRemoveAccess = async (adminProfile: AdminProfile) => {
    if (!session || !isOwner) {
      return;
    }
    if (adminProfile.user_id === session.user.id) {
      setError("You cannot remove your own admin access.");
      return;
    }
    if (adminProfile.role === "owner" && ownerCount <= 1) {
      setError("At least one owner must remain.");
      return;
    }

    const confirmed = window.confirm(
      `Remove admin access for ${adminProfile.email}? Their Supabase Auth account will not be deleted.`,
    );
    if (!confirmed) {
      return;
    }

    await withAction(`remove:${adminProfile.user_id}`, async () => {
      await removeAdminAccess(session.accessToken, adminProfile.user_id);
      await loadProfiles();
      setNotice(`${adminProfile.email} no longer has admin access.`);
    });
  };

  return (
    <AdminShell title="Admins" eyebrow="Owner controls" actions={<AdminTopActions />}>
      {!isOwner ? (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Owner access required</h2>
          </div>
          <p className="admin-helper-text">
            Only owner accounts can invite admins or change admin roles.
          </p>
        </section>
      ) : (
        <>
          <section className="admin-panel">
            <div className="admin-section-heading">
              <h2>Invite admin</h2>
            </div>
            <p className="admin-helper-text">
              This sends a Supabase invite email. The new admin sets their own
              password from the invite link.
            </p>
            <form className="admin-form admin-admin-invite-form" onSubmit={handleInvite}>
              <label>
                Email
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="new-admin@example.com"
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as AdminWritableRole)}
                >
                  {roleOptions.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-form-actions">
                <button
                  className="admin-small-button"
                  disabled={actionKey === "invite"}
                  type="submit"
                >
                  {actionKey === "invite" ? "Sending..." : "Send invite"}
                </button>
              </div>
            </form>
          </section>

          {loading ? <p className="soft-status">Loading admins...</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}
          {notice ? <p className="admin-success">{notice}</p> : null}

          <section className="admin-panel">
            <div className="table-toolbar">
              <h3>Current admins</h3>
            </div>
            {profiles.length === 0 && !loading ? (
              <p className="empty-state">No admin profiles found.</p>
            ) : null}
            {profiles.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table admin-users-table">
                  <colgroup>
                    <col className="admin-user-email-col" />
                    <col className="admin-user-role-col" />
                    <col className="admin-user-created-col" />
                    <col className="admin-user-action-col" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((adminProfile) => {
                      const isSelf = adminProfile.user_id === session?.user.id;
                      const roleActionKey = `role:${adminProfile.user_id}`;
                      const removeActionKey = `remove:${adminProfile.user_id}`;
                      const roleDisabled =
                        Boolean(actionKey) ||
                        isSelf ||
                        (adminProfile.role === "owner" && ownerCount <= 1);
                      const removeDisabled =
                        Boolean(actionKey) ||
                        isSelf ||
                        (adminProfile.role === "owner" && ownerCount <= 1);

                      return (
                        <tr key={adminProfile.user_id}>
                          <td className="admin-text-cell">
                            <strong>{adminProfile.email}</strong>
                            {isSelf ? <span>Current account</span> : null}
                          </td>
                          <td>
                            <select
                              className="admin-table-select"
                              disabled={roleDisabled}
                              value={adminProfile.role}
                              onChange={(event) =>
                                void handleRoleChange(
                                  adminProfile,
                                  event.target.value as AdminWritableRole,
                                )
                              }
                            >
                              {roleOptions.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {roleOption}
                                </option>
                              ))}
                            </select>
                            {actionKey === roleActionKey ? (
                              <span>Updating role...</span>
                            ) : null}
                          </td>
                          <td className="admin-nowrap-cell">
                            {formatDate(adminProfile.created_at)}
                          </td>
                          <td>
                            <button
                              className="admin-small-button admin-danger-button"
                              disabled={removeDisabled}
                              type="button"
                              onClick={() => void handleRemoveAccess(adminProfile)}
                            >
                              {actionKey === removeActionKey
                                ? "Removing..."
                                : "Remove access"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      )}
    </AdminShell>
  );
};
