import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "../components/admin/AdminShell";
import { Button } from "../components/common/Button";
import { useAdminAuth } from "../hooks/useAdminAuth";
import {
  createCaseImages,
  createAdminCase,
  createFundType,
  createSupportCategory,
  emptyCaseFormInput,
  caseToFormInput,
  fetchCaseFormOptions,
  fetchAdminCase,
  fetchNextCaseNumber,
  periodSortFromLabel,
  updateAdminCase,
  uploadCaseImage,
} from "../services/adminCases";
import type { CaseFormInput, CaseImageUpload } from "../types/admin";

const amountFields = [
  "zakat_amount",
  "sadaqah_amount",
  "other_amount",
] as const;

const hasOption = (options: string[], value: string): boolean =>
  options.some((option) => option.toLowerCase() === value.trim().toLowerCase());

export const AdminNewCase = () => {
  const { session } = useAdminAuth();
  const navigate = useNavigate();
  const { caseNumber: routeCaseNumber } = useParams();
  const isEditing = Boolean(routeCaseNumber);
  const [form, setForm] = useState<CaseFormInput>(emptyCaseFormInput);
  const [categories, setCategories] = useState<string[]>([]);
  const [fundTypes, setFundTypes] = useState<string[]>([]);
  const [usesCustomCategory, setUsesCustomCategory] = useState(false);
  const [usesCustomFundType, setUsesCustomFundType] = useState(false);
  const [imageFiles, setImageFiles] = useState<
    Partial<Record<1 | 2 | 3, File>>
  >({});
  const [loading, setLoading] = useState(isEditing);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!session) {
      setOptionsLoading(false);
      return;
    }

    let isMounted = true;

    const loadOptions = async () => {
      setOptionsLoading(true);

      try {
        const options = await fetchCaseFormOptions(session.accessToken);
        if (isMounted) {
          setCategories(options.categories.map((option) => option.name));
          setFundTypes(options.fundTypes.map((option) => option.name));
        }
      } catch (optionsError) {
        if (isMounted) {
          setError(
            optionsError instanceof Error
              ? optionsError.message
              : "Could not load form options.",
          );
        }
      } finally {
        if (isMounted) {
          setOptionsLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !routeCaseNumber) {
      return;
    }

    let isMounted = true;

    const loadCase = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const adminCase = await fetchAdminCase(session.accessToken, routeCaseNumber);
        if (isMounted) {
          const nextForm = caseToFormInput(adminCase);
          setForm(nextForm);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load case details.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCase();

    return () => {
      isMounted = false;
    };
  }, [routeCaseNumber, session]);

  useEffect(() => {
    if (!form.support_category.trim() || optionsLoading) {
      return;
    }

    setUsesCustomCategory(!hasOption(categories, form.support_category));
  }, [categories, form.support_category, optionsLoading]);

  useEffect(() => {
    if (!form.fund_source.trim() || optionsLoading) {
      return;
    }

    setUsesCustomFundType(!hasOption(fundTypes, form.fund_source));
  }, [fundTypes, form.fund_source, optionsLoading]);

  const updateField = (
    field: keyof CaseFormInput,
    value: string | boolean,
  ): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = (): string | undefined => {
    if (!form.reporting_month.trim()) {
      return "Period is required.";
    }
    if (!periodSortFromLabel(form.reporting_month)) {
      return "Use a period like May 2026 so reports can be sorted correctly.";
    }
    if (!form.support_category.trim()) {
      return "Category is required.";
    }
    if (!form.support_description.trim()) {
      return "Support description is required.";
    }
    if (!form.fund_source.trim()) {
      return "Fund type is required.";
    }
    const hasAmount = amountFields.some(
      (field) => Number(form[field].replace(/[₹,\s]/g, "")) > 0,
    );
    if (!hasAmount) {
      return "Add at least one amount.";
    }
    if (form.publish_public_story && !form.public_need_summary.trim()) {
      return "Add public-safe story text before publishing.";
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
      if (!hasOption(categories, form.support_category)) {
        await createSupportCategory(session.accessToken, form.support_category);
      }
      if (!hasOption(fundTypes, form.fund_source)) {
        await createFundType(session.accessToken, form.fund_source);
      }

      const caseNumber =
        form.case_number.trim() || (await fetchNextCaseNumber(session.accessToken));
      const formWithImages = {
        ...form,
        case_number: caseNumber,
      };
      const uploadedImages: CaseImageUpload[] = [];

      for (const slot of [1, 2, 3] as const) {
        const file = imageFiles[slot];
        if (file) {
          uploadedImages.push(
            await uploadCaseImage(session.accessToken, caseNumber, slot, file),
          );
        }
      }

      const savedCase =
        isEditing && routeCaseNumber
          ? await updateAdminCase(session.accessToken, routeCaseNumber, formWithImages)
          : await createAdminCase(session.accessToken, formWithImages);
      await createCaseImages(session.accessToken, savedCase.case_number, uploadedImages);
      navigate("/admin/cases");
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Could not create case.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title={isEditing ? "Edit case" : "Add case"}
      eyebrow="Private ledger"
    >
      {loading ? <p className="soft-status">Loading case details...</p> : null}
      <form className="admin-form admin-case-form" onSubmit={handleSubmit}>
        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Case basics</h2>
          </div>
          <div className="admin-form-grid">
            <label>
              Period
              <input
                value={form.reporting_month}
                onChange={(event) => updateField("reporting_month", event.target.value)}
                placeholder="May 2026"
                required
              />
            </label>
            <label>
              Category
              <select
                disabled={optionsLoading}
                value={
                  usesCustomCategory
                    ? "__custom__"
                    : form.support_category
                }
                onChange={(event) => {
                  if (event.target.value === "__custom__") {
                    setUsesCustomCategory(true);
                    updateField("support_category", "");
                    return;
                  }

                  setUsesCustomCategory(false);
                  updateField("support_category", event.target.value);
                }}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="__custom__">Add new category</option>
              </select>
            </label>
            {usesCustomCategory ? (
              <label>
                New category
                <input
                  value={form.support_category}
                  onChange={(event) =>
                    updateField("support_category", event.target.value)
                  }
                  placeholder="Enter category name"
                  required
                />
              </label>
            ) : null}
            <label>
              Support description
              <input
                value={form.support_description}
                onChange={(event) =>
                  updateField("support_description", event.target.value)
                }
                placeholder="Sewing machine, course fee, ration support"
                required
              />
            </label>
            <label>
              Fund type
              <select
                disabled={optionsLoading}
                value={
                  usesCustomFundType
                    ? "__custom__"
                    : form.fund_source
                }
                onChange={(event) => {
                  if (event.target.value === "__custom__") {
                    setUsesCustomFundType(true);
                    updateField("fund_source", "");
                    return;
                  }

                  setUsesCustomFundType(false);
                  updateField("fund_source", event.target.value);
                }}
                required
              >
                <option value="">Select fund</option>
                {fundTypes.map((fundType) => (
                  <option key={fundType} value={fundType}>
                    {fundType}
                  </option>
                ))}
                <option value="__custom__">Add new fund type</option>
              </select>
            </label>
            {usesCustomFundType ? (
              <label>
                New fund type
                <input
                  value={form.fund_source}
                  onChange={(event) => updateField("fund_source", event.target.value)}
                  placeholder="Enter fund type"
                  required
                />
              </label>
            ) : null}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Ledger amounts</h2>
          </div>
          <div className="admin-form-grid three">
            <label>
              Zakat amount
              <input
                inputMode="numeric"
                value={form.zakat_amount}
                onChange={(event) => updateField("zakat_amount", event.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              Sadaqah amount
              <input
                inputMode="numeric"
                value={form.sadaqah_amount}
                onChange={(event) => updateField("sadaqah_amount", event.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              Other amount
              <input
                inputMode="numeric"
                value={form.other_amount}
                onChange={(event) => updateField("other_amount", event.target.value)}
                placeholder="0"
              />
            </label>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Private details</h2>
          </div>
          <div className="admin-form-grid">
            <label>
              Beneficiary name
              <input
                value={form.beneficiary_name}
                onChange={(event) => updateField("beneficiary_name", event.target.value)}
              />
            </label>
            <label>
              Beneficiary phone
              <input
                value={form.beneficiary_phone}
                onChange={(event) => updateField("beneficiary_phone", event.target.value)}
              />
            </label>
            <label>
              Private location
              <input
                value={form.beneficiary_private_location}
                onChange={(event) =>
                  updateField("beneficiary_private_location", event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Public-safe fields</h2>
          </div>
          <div className="admin-toggle-grid">
            <label>
              <input
                type="checkbox"
                checked={form.show_in_public_stats}
                onChange={(event) =>
                  updateField("show_in_public_stats", event.target.checked)
                }
              />
              Include in public stats
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.publish_public_story}
                onChange={(event) =>
                  updateField("publish_public_story", event.target.checked)
                }
              />
              Publish as story
            </label>
          </div>
          <div className="admin-form-grid">
            <label>
              Public title
              <input
                value={form.public_story_title}
                onChange={(event) => updateField("public_story_title", event.target.value)}
              />
            </label>
            <label>
              Public display name
              <input
                value={form.public_beneficiary_label}
                onChange={(event) =>
                  updateField("public_beneficiary_label", event.target.value)
                }
                placeholder="Anonymous case"
              />
            </label>
            <label>
              Public location
              <input
                value={form.public_location}
                onChange={(event) => updateField("public_location", event.target.value)}
              />
            </label>
            <label className="admin-field-wide">
              Public need
              <textarea
                value={form.public_need_summary}
                onChange={(event) => updateField("public_need_summary", event.target.value)}
              />
            </label>
            <label className="admin-field-wide">
              Public support provided
              <textarea
                value={form.public_support_summary}
                onChange={(event) =>
                  updateField("public_support_summary", event.target.value)
                }
              />
            </label>
            <label className="admin-field-wide">
              Public outcome
              <textarea
                value={form.public_outcome_summary}
                onChange={(event) =>
                  updateField("public_outcome_summary", event.target.value)
                }
              />
            </label>
            <label className="admin-field-wide">
              Public follow-up
              <textarea
                value={form.public_follow_up_summary}
                onChange={(event) =>
                  updateField("public_follow_up_summary", event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>Case images</h2>
          </div>
          <div className="admin-form-grid">
            <label>
              Case image 1
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFiles((current) => ({
                    ...current,
                    1: event.target.files?.[0],
                  }))
                }
              />
            </label>
            <label>
              Case image 2
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFiles((current) => ({
                    ...current,
                    2: event.target.files?.[0],
                  }))
                }
              />
            </label>
            <label>
              Case image 3
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFiles((current) => ({
                    ...current,
                    3: event.target.files?.[0],
                  }))
                }
              />
            </label>
          </div>
        </section>

        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-form-actions">
          <Button disabled={submitting}>
            {submitting ? "Saving..." : "Save case"}
          </Button>
          <Button to="/admin/cases" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </AdminShell>
  );
};
