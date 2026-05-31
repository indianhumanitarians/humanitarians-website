import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminMentorshipTestimonials } from "../hooks/useAdminMentorshipTestimonials";
import { deleteAdminMentorshipTestimonial } from "../services/adminCases";

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const emptyValue = (value: string | null | undefined): string =>
  value?.trim() || "-";

const previewText = (value: string | null | undefined, length = 120): string => {
  const text = emptyValue(value);

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}...`;
};

export const AdminMentorshipTestimonials = () => {
  const { session } = useAdminAuth();
  const {
    testimonials,
    loading: testimonialsLoading,
    error: testimonialsError,
    reload,
  } = useAdminMentorshipTestimonials(session?.accessToken);
  const [deletingTestimonial, setDeletingTestimonial] = useState<string | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const handleDeleteTestimonial = async (
    testimonialId: string,
    testimonialLabel: string,
  ) => {
    if (!session || deletingTestimonial) {
      return;
    }

    const confirmed = window.confirm(`Delete testimonial ${testimonialLabel}?`);
    if (!confirmed) {
      return;
    }

    setDeletingTestimonial(testimonialId);
    setDeleteError(undefined);

    try {
      await deleteAdminMentorshipTestimonial(session.accessToken, testimonialId);
      await reload();
    } catch (deleteTestimonialError) {
      setDeleteError(
        deleteTestimonialError instanceof Error
          ? deleteTestimonialError.message
          : "Could not delete testimonial.",
      );
    } finally {
      setDeletingTestimonial(undefined);
    }
  };

  return (
    <AdminShell
      title="Mentorship testimonials"
      eyebrow="Mentorship admin"
      actions={<AdminTopActions />}
    >
      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Mentorship testimonials</h3>
        </div>
        {testimonialsLoading ? (
          <p className="soft-status">Loading testimonials...</p>
        ) : null}
        {testimonialsError ? (
          <p className="admin-error">{testimonialsError}</p>
        ) : null}
        {deleteError ? <p className="admin-error">{deleteError}</p> : null}
        {!testimonialsLoading && testimonials.length === 0 ? (
          <p className="empty-state">No mentorship testimonials have been added yet.</p>
        ) : null}
        {testimonials.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-extra-wide-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Track</th>
                  <th>Stage</th>
                  <th>Location</th>
                  <th>Period</th>
                  <th>Outcome</th>
                  <th>Testimonial</th>
                  <th>Tagline</th>
                  <th>Image</th>
                  <th>Privacy</th>
                  <th>Consent</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((item) => (
                  <tr key={item.testimonial_id}>
                    <td className="admin-nowrap-cell">{item.testimonial_id}</td>
                    <td className="admin-text-cell">
                      <strong>{item.anonymized_name || "Anonymous"}</strong>
                    </td>
                    <td className="admin-text-cell">{emptyValue(item.public_role)}</td>
                    <td className="admin-text-cell">{emptyValue(item.mentorship_track)}</td>
                    <td className="admin-text-cell">{emptyValue(item.mentee_stage)}</td>
                    <td className="admin-text-cell">{emptyValue(item.public_location)}</td>
                    <td className="admin-nowrap-cell">{emptyValue(item.period_label)}</td>
                    <td className="admin-text-cell">{previewText(item.outcome_summary)}</td>
                    <td className="admin-text-cell">{previewText(item.testimonial_text)}</td>
                    <td className="admin-text-cell">{emptyValue(item.carousel_tagline)}</td>
                    <td className="admin-text-cell">
                      {item.profile_image_url ? (
                        <a
                          className="admin-inline-link"
                          href={item.profile_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View image
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="admin-text-cell">{previewText(item.privacy_note, 80)}</td>
                    <td className="admin-nowrap-cell">
                      <span className={`status-pill ${item.consent_received ? "on" : ""}`}>
                        {item.consent_received ? "Public" : "Private"}
                      </span>
                    </td>
                    <td className="admin-nowrap-cell">{formatDate(item.updated_at)}</td>
                    <td className="admin-nowrap-cell">
                      <div className="admin-table-actions">
                        <Link
                          className="admin-inline-link"
                          to={`/admin/testimonials/${item.testimonial_id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-small-button admin-danger-button"
                          disabled={deletingTestimonial === item.testimonial_id}
                          onClick={() =>
                            void handleDeleteTestimonial(
                              item.testimonial_id,
                              item.testimonial_id,
                            )
                          }
                        >
                          {deletingTestimonial === item.testimonial_id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
};
