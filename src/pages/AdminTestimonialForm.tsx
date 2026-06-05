import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "../components/admin/AdminShell";
import { Button } from "../components/common/Button";
import { useAdminAuth } from "../hooks/useAdminAuth";
import {
  createAdminMentorshipTestimonial,
  emptyTestimonialFormInput,
  fetchAdminMentorshipTestimonial,
  fetchNextTestimonialId,
  testimonialToFormInput,
  updateAdminMentorshipTestimonial,
  uploadTestimonialImage,
} from "../services/adminCases";
import type { TestimonialFormInput } from "../types/admin";

export const AdminTestimonialForm = () => {
  const { session } = useAdminAuth();
  const navigate = useNavigate();
  const { testimonialId: routeTestimonialId } = useParams();
  const isEditing = Boolean(routeTestimonialId);
  const [form, setForm] = useState<TestimonialFormInput>(
    emptyTestimonialFormInput,
  );
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [profileImageFile, setProfileImageFile] = useState<File | undefined>();
  const [existingProfileImageUrl, setExistingProfileImageUrl] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (!session || !routeTestimonialId) {
      return;
    }

    let isMounted = true;

    const loadTestimonial = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const testimonial = await fetchAdminMentorshipTestimonial(
          session.accessToken,
          routeTestimonialId,
        );
        if (isMounted) {
          setForm(testimonialToFormInput(testimonial));
          setExistingProfileImageUrl(testimonial.profile_image_url ?? undefined);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load testimonial details.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadTestimonial();

    return () => {
      isMounted = false;
    };
  }, [session, routeTestimonialId]);

  const updateField = (
    field: keyof TestimonialFormInput,
    value: string | boolean,
  ): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = (): string | undefined => {
    if (!form.anonymized_name.trim()) {
      return "Display name is required.";
    }
    if (!form.public_role.trim()) {
      return "Public role is required.";
    }
    if (!form.testimonial_text.trim()) {
      return "Testimonial text is required.";
    }

    return undefined;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!session) {
      setError("Admin session is not available.");
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const testimonialId =
        form.testimonial_id.trim() ||
        (isEditing ? routeTestimonialId : undefined) ||
        (await fetchNextTestimonialId(session.accessToken));
      const formWithId = {
        ...form,
        testimonial_id: testimonialId,
      };
      const uploadedImage = profileImageFile
        ? await uploadTestimonialImage(
            session.accessToken,
            testimonialId,
            profileImageFile,
          )
        : undefined;

      if (isEditing && routeTestimonialId) {
        await updateAdminMentorshipTestimonial(
          session.accessToken,
          routeTestimonialId,
          formWithId,
          uploadedImage,
        );
      } else {
        await createAdminMentorshipTestimonial(
          session.accessToken,
          formWithId,
          uploadedImage,
        );
      }

      navigate("/admin/testimonials");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save testimonial.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title={isEditing ? "Edit testimonial" : "Add testimonial"}
      eyebrow="Mentorship admin"
    >
      {loading ? <p className="soft-status">Loading testimonial...</p> : null}
      <form className="admin-form admin-case-form" onSubmit={handleSubmit}>
        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Public details</h2>
          </div>
          <div className="admin-form-grid">
            <label>
              Display name
              <input
                value={form.anonymized_name}
                onChange={(event) =>
                  updateField("anonymized_name", event.target.value)
                }
                placeholder="Anonymous mentee"
                required
              />
            </label>
            <label>
              Public role
              <input
                value={form.public_role}
                onChange={(event) => updateField("public_role", event.target.value)}
                placeholder="Student, mentee, professional"
                required
              />
            </label>
            <label>
              Mentorship track
              <input
                value={form.mentorship_track}
                onChange={(event) =>
                  updateField("mentorship_track", event.target.value)
                }
              />
            </label>
            <label>
              Mentee stage
              <input
                value={form.mentee_stage}
                onChange={(event) =>
                  updateField("mentee_stage", event.target.value)
                }
              />
            </label>
            <label>
              Public location
              <input
                value={form.public_location}
                onChange={(event) =>
                  updateField("public_location", event.target.value)
                }
              />
            </label>
            <label>
              Period
              <input
                value={form.period_label}
                onChange={(event) => updateField("period_label", event.target.value)}
                placeholder="May 2026"
              />
            </label>
            <label className="admin-field-wide">
              Outcome summary
              <textarea
                value={form.outcome_summary}
                onChange={(event) =>
                  updateField("outcome_summary", event.target.value)
                }
              />
            </label>
            <label className="admin-field-wide">
              Testimonial text
              <textarea
                value={form.testimonial_text}
                onChange={(event) =>
                  updateField("testimonial_text", event.target.value)
                }
                required
              />
            </label>
            <label className="admin-field-wide">
              Carousel tagline
              <input
                value={form.carousel_tagline}
                onChange={(event) =>
                  updateField("carousel_tagline", event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Consent and image</h2>
          </div>
          <div className="admin-toggle-grid">
            <label>
              <input
                type="checkbox"
                checked={form.consent_received}
                onChange={(event) =>
                  updateField("consent_received", event.target.checked)
                }
              />
              Consent received
            </label>
          </div>
          <div className="admin-form-grid">
            <label>
              Profile image
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setProfileImageFile(event.target.files?.[0])
                }
              />
            </label>
            {existingProfileImageUrl ? (
              <p className="soft-status">
                Existing image is already uploaded. Choosing a new file will replace it for this testimonial.
              </p>
            ) : null}
            <label className="admin-field-wide">
              Privacy note
              <textarea
                value={form.privacy_note}
                onChange={(event) => updateField("privacy_note", event.target.value)}
              />
            </label>
            <label className="admin-field-wide">
              Editing note
              <textarea
                value={form.editing_note}
                onChange={(event) => updateField("editing_note", event.target.value)}
              />
            </label>
          </div>
        </section>

        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-form-actions">
          <Button disabled={submitting}>
            {submitting ? "Saving..." : "Save testimonial"}
          </Button>
          <Button to="/admin/testimonials" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </AdminShell>
  );
};
