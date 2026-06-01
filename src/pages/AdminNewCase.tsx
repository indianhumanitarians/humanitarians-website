import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "../components/admin/AdminShell";
import { Button } from "../components/common/Button";
import { useAdminAuth } from "../hooks/useAdminAuth";
import {
  createCaseImages,
  createAdminCase,
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

const monthPickerMonths = [
  { short: "Jan", long: "January" },
  { short: "Feb", long: "February" },
  { short: "Mar", long: "March" },
  { short: "Apr", long: "April" },
  { short: "May", long: "May" },
  { short: "Jun", long: "June" },
  { short: "Jul", long: "July" },
  { short: "Aug", long: "August" },
  { short: "Sep", long: "September" },
  { short: "Oct", long: "October" },
  { short: "Nov", long: "November" },
  { short: "Dec", long: "December" },
];

const hasOption = (options: string[], value: string): boolean =>
  options.some((option) => option.toLowerCase() === value.trim().toLowerCase());

const includeSelectedOption = (options: string[], value: string): string[] => {
  const trimmedValue = value.trim();
  if (!trimmedValue || hasOption(options, trimmedValue)) {
    return options;
  }

  return [...options, trimmedValue];
};

const parseMonthInput = (
  value: string,
): { year: number; monthIndex: number } | null => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  return year > 1900 && monthIndex >= 0 && monthIndex < 12
    ? { year, monthIndex }
    : null;
};

const toMonthInputValue = (year: number, monthIndex: number): string =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

const currentMonthInputValue = (): string => {
  const today = new Date();
  return toMonthInputValue(today.getFullYear(), today.getMonth());
};

const formatMonthInput = (value: string): string => {
  const parsed = parseMonthInput(value);
  if (!parsed) {
    return "";
  }

  return `${monthPickerMonths[parsed.monthIndex].long} ${parsed.year}`;
};

interface AdminMonthPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const AdminMonthPicker = ({ value, onChange }: AdminMonthPickerProps) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedMonth = parseMonthInput(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selectedMonth?.year ?? new Date().getFullYear(),
  );

  useEffect(() => {
    if (isOpen) {
      setViewYear(selectedMonth?.year ?? new Date().getFullYear());
    }
  }, [isOpen, selectedMonth?.year]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectMonth = (monthIndex: number): void => {
    onChange(toMonthInputValue(viewYear, monthIndex));
    setIsOpen(false);
  };

  const selectCurrentMonth = (): void => {
    onChange(currentMonthInputValue());
    setIsOpen(false);
  };

  return (
    <div
      className={`admin-month-picker${isOpen ? " is-open" : ""}`}
      ref={pickerRef}
    >
      <button
        type="button"
        className="admin-month-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{formatMonthInput(value) || "Select month"}</span>
        <span className="admin-month-picker-icon" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="admin-month-popover" role="dialog" aria-label="Choose month">
          <div className="admin-month-popover-header">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => setViewYear((year) => year - 1)}
            >
              {"<"}
            </button>
            <strong>{viewYear}</strong>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => setViewYear((year) => year + 1)}
            >
              {">"}
            </button>
          </div>
          <div className="admin-month-grid">
            {monthPickerMonths.map((month, index) => {
              const isSelected =
                selectedMonth?.year === viewYear &&
                selectedMonth.monthIndex === index;

              return (
                <button
                  type="button"
                  className={isSelected ? "is-selected" : undefined}
                  key={month.short}
                  onClick={() => selectMonth(index)}
                >
                  {month.short}
                </button>
              );
            })}
          </div>
          <div className="admin-month-popover-footer">
            <button type="button" onClick={selectCurrentMonth}>
              This month
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const AdminNewCase = () => {
  const { session } = useAdminAuth();
  const navigate = useNavigate();
  const { caseNumber: routeCaseNumber } = useParams();
  const isEditing = Boolean(routeCaseNumber);
  const [form, setForm] = useState<CaseFormInput>(emptyCaseFormInput);
  const [categories, setCategories] = useState<string[]>([]);
  const [fundTypes, setFundTypes] = useState<string[]>([]);
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

  const updateField = (
    field: keyof CaseFormInput,
    value: string | boolean,
  ): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = (): string | undefined => {
    if (!form.reporting_month.trim()) {
      return "Month is required.";
    }
    if (!periodSortFromLabel(form.reporting_month)) {
      return "Choose a valid month so reports can be sorted correctly.";
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

  const categoryOptions = includeSelectedOption(categories, form.support_category);
  const fundTypeOptions = includeSelectedOption(fundTypes, form.fund_source);

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
            <div className="admin-month-field">
              <span>Month</span>
              <AdminMonthPicker
                value={form.reporting_month}
                onChange={(value) => updateField("reporting_month", value)}
              />
            </div>
            <label>
              Category
              <select
                disabled={optionsLoading}
                value={form.support_category}
                onChange={(event) =>
                  updateField("support_category", event.target.value)
                }
                required
              >
                <option value="">Select category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
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
                value={form.fund_source}
                onChange={(event) =>
                  updateField("fund_source", event.target.value)
                }
                required
              >
                <option value="">Select fund</option>
                {fundTypeOptions.map((fundType) => (
                  <option key={fundType} value={fundType}>
                    {fundType}
                  </option>
                ))}
              </select>
            </label>
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
