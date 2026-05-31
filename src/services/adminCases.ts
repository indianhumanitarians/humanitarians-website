import type {
  AdminCase,
  AdminMentorshipTestimonial,
  CaseLookupOption,
  CaseFormInput,
  CaseImageUpload,
  TestimonialImageUpload,
  TestimonialFormInput,
} from "../types/admin";
import type { CaseLedgerRow, MentorshipTestimonial } from "../types/stats";
import {
  assertSupabaseConfigured,
  getSupabaseHeaders,
  supabaseConfig,
} from "./supabaseConfig";
import { supabaseRestRequest } from "./supabaseRest";

const MONTHS = new Map(
  [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ].map((month, index) => [month, index + 1]),
);

const CASE_NUMBER_PATTERN = /^HUM-(\d+)$/i;

export const emptyCaseFormInput: CaseFormInput = {
  case_number: "",
  reporting_month: "",
  support_category: "",
  support_description: "",
  fund_source: "",
  zakat_amount: "",
  sadaqah_amount: "",
  other_amount: "",
  beneficiary_name: "",
  beneficiary_phone: "",
  beneficiary_private_location: "",
  public_story_title: "",
  public_beneficiary_label: "",
  public_location: "",
  public_need_summary: "",
  public_support_summary: "",
  public_outcome_summary: "",
  public_follow_up_summary: "",
  show_in_public_stats: true,
  publish_public_story: false,
};

export const emptyTestimonialFormInput: TestimonialFormInput = {
  testimonial_id: "",
  anonymized_name: "",
  public_role: "",
  mentorship_track: "",
  mentee_stage: "",
  public_location: "",
  period_label: "",
  outcome_summary: "",
  testimonial_text: "",
  carousel_tagline: "",
  consent_received: false,
  privacy_note: "",
  editing_note: "",
};

const toNumber = (value: string): number =>
  Number(value.replace(/[₹,\s]/g, "")) || 0;

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const sortLookupOptions = (options: CaseLookupOption[]): CaseLookupOption[] =>
  [...options].sort(
    (left, right) =>
      Number(right.is_active) - Number(left.is_active) ||
      left.display_order - right.display_order ||
      left.name.localeCompare(right.name),
  );

export type CaseLookupTable = "support_categories" | "fund_types";

const lookupCaseFieldByTable: Record<CaseLookupTable, keyof AdminCase> = {
  support_categories: "support_category",
  fund_types: "fund_source",
};

export const periodSortFromLabel = (periodLabel: string): number | null => {
  const [monthText, yearText] = periodLabel.trim().split(/\s+/);
  const month = MONTHS.get(monthText?.slice(0, 3).toLowerCase() ?? "");
  const year = Number(yearText);

  if (!month || !Number.isFinite(year)) {
    return null;
  }

  return year * 100 + month;
};

const monthStartFromSort = (periodSort: number | null): string | null => {
  if (!periodSort) {
    return null;
  }

  const year = Math.floor(periodSort / 100);
  const month = periodSort % 100;

  if (!year || month < 1 || month > 12) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
};

export const caseNumberSequence = (caseNumber: string): number | null => {
  const sequence = Number(caseNumber.trim().match(CASE_NUMBER_PATTERN)?.[1]);
  return Number.isFinite(sequence) && sequence > 0 ? sequence : null;
};

export const generateCaseNumber = (caseNumbers: string[] = []): string => {
  const nextSequence =
    Math.max(
      0,
      ...caseNumbers
        .map(caseNumberSequence)
        .filter((sequence): sequence is number => sequence !== null),
    ) + 1;

  return `HUM-${String(nextSequence).padStart(3, "0")}`;
};

const toCasePayload = (input: CaseFormInput) => {
  const periodSort = periodSortFromLabel(input.reporting_month);

  return {
    case_number: emptyToNull(input.case_number) ?? generateCaseNumber(),
    reporting_month: input.reporting_month.trim(),
    reporting_month_sort: periodSort,
    reporting_month_start: monthStartFromSort(periodSort),
    support_category: input.support_category.trim(),
    support_description: input.support_description.trim(),
    fund_source: input.fund_source.trim(),
    zakat_amount: toNumber(input.zakat_amount),
    sadaqah_amount: toNumber(input.sadaqah_amount),
    other_amount: toNumber(input.other_amount),
    beneficiary_name: emptyToNull(input.beneficiary_name),
    beneficiary_phone: emptyToNull(input.beneficiary_phone),
    beneficiary_private_location: emptyToNull(input.beneficiary_private_location),
    public_story_title: emptyToNull(input.public_story_title),
    public_beneficiary_label: emptyToNull(input.public_beneficiary_label),
    public_location: emptyToNull(input.public_location),
    public_need_summary: emptyToNull(input.public_need_summary),
    public_support_summary: emptyToNull(input.public_support_summary),
    public_outcome_summary: emptyToNull(input.public_outcome_summary),
    public_follow_up_summary: emptyToNull(input.public_follow_up_summary),
    show_in_public_stats: input.show_in_public_stats,
    publish_public_story: input.publish_public_story,
  };
};

export const caseToFormInput = (item: AdminCase): CaseFormInput => ({
  case_number: item.case_number,
  reporting_month: item.reporting_month,
  support_category: item.support_category,
  support_description: item.support_description,
  fund_source: item.fund_source,
  zakat_amount: String(item.zakat_amount ?? 0),
  sadaqah_amount: String(item.sadaqah_amount ?? 0),
  other_amount: String(item.other_amount ?? 0),
  beneficiary_name: item.beneficiary_name ?? "",
  beneficiary_phone: item.beneficiary_phone ?? "",
  beneficiary_private_location: item.beneficiary_private_location ?? "",
  public_story_title: item.public_story_title ?? "",
  public_beneficiary_label: item.public_beneficiary_label ?? "",
  public_location: item.public_location ?? "",
  public_need_summary: item.public_need_summary ?? "",
  public_support_summary: item.public_support_summary ?? "",
  public_outcome_summary: item.public_outcome_summary ?? "",
  public_follow_up_summary: item.public_follow_up_summary ?? "",
  show_in_public_stats: item.show_in_public_stats,
  publish_public_story: item.publish_public_story,
});

export const fetchAdminCases = async (token: string): Promise<AdminCase[]> =>
  supabaseRestRequest<AdminCase[]>("cases", {
    token,
    query: {
      select: "*",
      order: "created_at.desc",
    },
  });

export const fetchNextCaseNumber = async (token: string): Promise<string> => {
  const rows = await supabaseRestRequest<Array<Pick<AdminCase, "case_number">>>(
    "cases",
    {
      token,
      query: {
        select: "case_number",
      },
    },
  );

  return generateCaseNumber(rows.map((row) => row.case_number));
};

export const fetchCaseFormOptions = async (
  token: string,
): Promise<{
  categories: CaseLookupOption[];
  fundTypes: CaseLookupOption[];
}> => {
  const [categories, fundTypes] = await Promise.all([
    supabaseRestRequest<CaseLookupOption[]>("support_categories", {
      token,
      query: {
        select: "*",
        is_active: "eq.true",
        order: "display_order.asc,name.asc",
      },
    }),
    supabaseRestRequest<CaseLookupOption[]>("fund_types", {
      token,
      query: {
        select: "*",
        is_active: "eq.true",
        order: "display_order.asc,name.asc",
      },
    }),
  ]);

  return {
    categories: sortLookupOptions(categories),
    fundTypes: sortLookupOptions(fundTypes),
  };
};

export const fetchAdminLookupLists = async (
  token: string,
): Promise<{
  categories: CaseLookupOption[];
  fundTypes: CaseLookupOption[];
}> => {
  const [categories, fundTypes] = await Promise.all([
    supabaseRestRequest<CaseLookupOption[]>("support_categories", {
      token,
      query: {
        select: "*",
        order: "is_active.desc,display_order.asc,name.asc",
      },
    }),
    supabaseRestRequest<CaseLookupOption[]>("fund_types", {
      token,
      query: {
        select: "*",
        order: "is_active.desc,display_order.asc,name.asc",
      },
    }),
  ]);

  return {
    categories: sortLookupOptions(categories),
    fundTypes: sortLookupOptions(fundTypes),
  };
};

const createLookupOption = async (
  token: string,
  table: "support_categories" | "fund_types",
  name: string,
): Promise<CaseLookupOption> => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Option name is required.");
  }

  const [createdOption] = await supabaseRestRequest<CaseLookupOption[]>(table, {
    method: "POST",
    token,
    query: { on_conflict: "name" },
    body: {
      name: trimmedName,
      is_active: true,
    },
    prefer: "resolution=merge-duplicates,return=representation",
  });

  return createdOption;
};

export const createSupportCategory = async (
  token: string,
  name: string,
): Promise<CaseLookupOption> =>
  createLookupOption(token, "support_categories", name);

export const createFundType = async (
  token: string,
  name: string,
): Promise<CaseLookupOption> => createLookupOption(token, "fund_types", name);

export const updateLookupOption = async (
  token: string,
  table: CaseLookupTable,
  option: CaseLookupOption,
  input: Pick<CaseLookupOption, "name" | "is_active">,
): Promise<CaseLookupOption> => {
  const nextName = input.name.trim();
  if (!nextName) {
    throw new Error("Name is required.");
  }

  const [updatedOption] = await supabaseRestRequest<CaseLookupOption[]>(table, {
    method: "PATCH",
    token,
    query: {
      id: `eq.${option.id}`,
    },
    body: {
      name: nextName,
      is_active: input.is_active,
    },
    prefer: "return=representation",
  });

  if (nextName !== option.name) {
    const caseField = lookupCaseFieldByTable[table];
    await supabaseRestRequest<void>("cases", {
      method: "PATCH",
      token,
      query: {
        [caseField]: `eq.${option.name}`,
      },
      body: {
        [caseField]: nextName,
      },
      prefer: "return=minimal",
    });
  }

  return updatedOption;
};

export const deleteLookupOption = async (
  token: string,
  table: CaseLookupTable,
  optionId: string,
): Promise<void> => {
  await supabaseRestRequest<void>(table, {
    method: "DELETE",
    token,
    query: {
      id: `eq.${optionId}`,
    },
    prefer: "return=minimal",
  });
};

export const fetchAdminCase = async (
  token: string,
  caseNumber: string,
): Promise<AdminCase> => {
  const [adminCase] = await supabaseRestRequest<AdminCase[]>("cases", {
    token,
    query: {
      select: "*",
      case_number: `eq.${caseNumber}`,
      limit: 1,
    },
  });

  if (!adminCase) {
    throw new Error("Case was not found.");
  }

  return adminCase;
};

export const createAdminCase = async (
  token: string,
  input: CaseFormInput,
): Promise<AdminCase> => {
  const [createdCase] = await supabaseRestRequest<AdminCase[]>("cases", {
    method: "POST",
    token,
    body: toCasePayload(input),
    prefer: "return=representation",
  });

  return createdCase;
};

export const updateAdminCase = async (
  token: string,
  caseNumber: string,
  input: CaseFormInput,
): Promise<AdminCase> => {
  const [updatedCase] = await supabaseRestRequest<AdminCase[]>("cases", {
    method: "PATCH",
    token,
    query: {
      case_number: `eq.${caseNumber}`,
    },
    body: toCasePayload(input),
    prefer: "return=representation",
  });

  return updatedCase;
};

export const deleteAdminCase = async (
  token: string,
  caseNumber: string,
): Promise<void> => {
  await supabaseRestRequest<void>("cases", {
    method: "DELETE",
    token,
    query: {
      case_number: `eq.${caseNumber}`,
    },
    prefer: "return=minimal",
  });
};

export const createCaseImages = async (
  token: string,
  caseNumber: string,
  images: CaseImageUpload[],
): Promise<void> => {
  if (images.length === 0) {
    return;
  }

  await supabaseRestRequest<void>("case_images", {
    method: "POST",
    token,
    query: {
      on_conflict: "case_number,display_order",
    },
    body: images.map((image) => ({
      case_number: caseNumber,
      display_order: image.display_order,
      storage_path: image.storage_path,
      public_url: image.public_url,
    })),
    prefer: "resolution=merge-duplicates,return=minimal",
  });
};

export const generateTestimonialId = (): string => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MENTOR-${stamp}-${suffix}`;
};

const toTestimonialPayload = (
  input: TestimonialFormInput,
  image?: TestimonialImageUpload,
) => ({
  testimonial_id: emptyToNull(input.testimonial_id) ?? generateTestimonialId(),
  anonymized_name: input.anonymized_name.trim(),
  public_role: input.public_role.trim(),
  mentorship_track: input.mentorship_track.trim(),
  mentee_stage: input.mentee_stage.trim(),
  public_location: input.public_location.trim(),
  period_label: input.period_label.trim(),
  outcome_summary: input.outcome_summary.trim(),
  testimonial_text: input.testimonial_text.trim(),
  ...(image
    ? {
        profile_image_storage_path: image.storage_path,
        profile_image_url: image.public_url,
      }
    : {}),
  carousel_tagline: input.carousel_tagline.trim(),
  consent_received: input.consent_received,
  privacy_note: input.privacy_note.trim(),
  editing_note: emptyToNull(input.editing_note),
});

export const testimonialToFormInput = (
  item: AdminMentorshipTestimonial,
): TestimonialFormInput => ({
  testimonial_id: item.testimonial_id,
  anonymized_name: item.anonymized_name,
  public_role: item.public_role,
  mentorship_track: item.mentorship_track,
  mentee_stage: item.mentee_stage,
  public_location: item.public_location,
  period_label: item.period_label,
  outcome_summary: item.outcome_summary,
  testimonial_text: item.testimonial_text,
  carousel_tagline: item.carousel_tagline,
  consent_received: item.consent_received,
  privacy_note: item.privacy_note,
  editing_note: item.editing_note ?? "",
});

export const fetchAdminMentorshipTestimonials = async (
  token: string,
): Promise<AdminMentorshipTestimonial[]> =>
  supabaseRestRequest<AdminMentorshipTestimonial[]>("mentorship_testimonials", {
    token,
    query: {
      select: "*",
      order: "created_at.desc",
    },
  });

export const fetchAdminMentorshipTestimonial = async (
  token: string,
  testimonialId: string,
): Promise<AdminMentorshipTestimonial> => {
  const [testimonial] = await supabaseRestRequest<AdminMentorshipTestimonial[]>(
    "mentorship_testimonials",
    {
      token,
      query: {
        select: "*",
        testimonial_id: `eq.${testimonialId}`,
        limit: 1,
      },
    },
  );

  if (!testimonial) {
    throw new Error("Testimonial was not found.");
  }

  return testimonial;
};

export const createAdminMentorshipTestimonial = async (
  token: string,
  input: TestimonialFormInput,
  image?: TestimonialImageUpload,
): Promise<AdminMentorshipTestimonial> => {
  const [createdTestimonial] = await supabaseRestRequest<
    AdminMentorshipTestimonial[]
  >("mentorship_testimonials", {
    method: "POST",
    token,
    body: toTestimonialPayload(input, image),
    prefer: "return=representation",
  });

  return createdTestimonial;
};

export const updateAdminMentorshipTestimonial = async (
  token: string,
  testimonialId: string,
  input: TestimonialFormInput,
  image?: TestimonialImageUpload,
): Promise<AdminMentorshipTestimonial> => {
  const [updatedTestimonial] = await supabaseRestRequest<
    AdminMentorshipTestimonial[]
  >("mentorship_testimonials", {
    method: "PATCH",
    token,
    query: {
      testimonial_id: `eq.${testimonialId}`,
    },
    body: toTestimonialPayload(input, image),
    prefer: "return=representation",
  });

  return updatedTestimonial;
};

export const deleteAdminMentorshipTestimonial = async (
  token: string,
  testimonialId: string,
): Promise<void> => {
  await supabaseRestRequest<void>("mentorship_testimonials", {
    method: "DELETE",
    token,
    query: {
      testimonial_id: `eq.${testimonialId}`,
    },
    prefer: "return=minimal",
  });
};

export const fetchPublicCaseLedgerRows = async (): Promise<CaseLedgerRow[]> =>
  supabaseRestRequest<CaseLedgerRow[]>("public_case_ledger", {
    query: {
      select: "*",
      order: "reporting_month_sort.desc",
    },
  });

export const fetchPublicMentorshipTestimonials = async (): Promise<
  MentorshipTestimonial[]
> =>
  supabaseRestRequest<MentorshipTestimonial[]>("public_mentorship_testimonials", {
    query: {
      select: "*",
      order: "testimonial_id.asc",
    },
  });

const sanitizeFileName = (fileName: string): string =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "case-image";

const encodeStoragePath = (path: string): string =>
  path.split("/").map(encodeURIComponent).join("/");

export const getCaseImagePublicUrl = (path: string): string =>
  `${supabaseConfig.url}/storage/v1/object/public/case-images/${encodeStoragePath(path)}`;

export const getTestimonialImagePublicUrl = (path: string): string =>
  `${supabaseConfig.url}/storage/v1/object/public/testimonial-images/${encodeStoragePath(path)}`;

export const uploadCaseImage = async (
  token: string,
  caseNumber: string,
  slot: 1 | 2 | 3,
  file: File,
): Promise<CaseImageUpload> => {
  assertSupabaseConfigured();

  const safeCaseNumber = caseNumber.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const path = `cases/${safeCaseNumber}/image-${slot}-${Date.now()}-${sanitizeFileName(file.name)}`;
  const response = await fetch(
    `${supabaseConfig.url}/storage/v1/object/case-images/${encodeStoragePath(path)}`,
    {
      method: "PUT",
      headers: getSupabaseHeaders(token, {
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      }),
      body: file,
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Could not upload case image ${slot}.`);
  }

  return {
    display_order: slot,
    storage_path: path,
    public_url: getCaseImagePublicUrl(path),
  };
};

export const uploadTestimonialImage = async (
  token: string,
  testimonialId: string,
  file: File,
): Promise<TestimonialImageUpload> => {
  assertSupabaseConfigured();

  const safeTestimonialId = testimonialId.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const path = `testimonials/${safeTestimonialId}/profile-${Date.now()}-${sanitizeFileName(file.name)}`;
  const response = await fetch(
    `${supabaseConfig.url}/storage/v1/object/testimonial-images/${encodeStoragePath(path)}`,
    {
      method: "PUT",
      headers: getSupabaseHeaders(token, {
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      }),
      body: file,
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not upload testimonial image.");
  }

  return {
    storage_path: path,
    public_url: getTestimonialImagePublicUrl(path),
  };
};
