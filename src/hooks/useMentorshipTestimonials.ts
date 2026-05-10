import type { DataSourceState, MentorshipTestimonial } from "../types/stats";
import { normalizeImageUrl, toFiniteNumber } from "../utils";
import { useCsvData } from "./useCsvData";

const testimonialColumns = [
  "testimonial_id",
  "display_order",
  "anonymized_name",
  "public_role",
  "mentorship_track",
  "mentee_stage",
  "public_location",
  "period_label",
  "outcome_summary",
  "testimonial_text",
  "profile_image_url",
  "profile_image_alt",
  "carousel_tagline",
  "consent_received",
  "publish_status",
  "privacy_note",
];

interface MentorshipTestimonialsState {
  testimonials: MentorshipTestimonial[];
  loading: boolean;
  source: DataSourceState;
}

const matches = (value: unknown, expected: string): boolean =>
  String(value ?? "").trim().toLowerCase() === expected.toLowerCase();

const isPublishable = (row: MentorshipTestimonial): boolean =>
  String(row.testimonial_id ?? "").trim().length > 0 &&
  matches(row.consent_received, "Yes") &&
  matches(row.publish_status, "Publish");

const normalizeTestimonial = (row: MentorshipTestimonial): MentorshipTestimonial => ({
  ...row,
  display_order: toFiniteNumber(row.display_order),
  profile_image_url: normalizeImageUrl(String(row.profile_image_url ?? "")),
});

const deriveTestimonials = (rows: MentorshipTestimonial[]): MentorshipTestimonial[] =>
  rows
    .filter(isPublishable)
    .map(normalizeTestimonial)
    .sort((a, b) => a.display_order - b.display_order);

const emptyTestimonials: MentorshipTestimonial[] = [];

export const useMentorshipTestimonials = (): MentorshipTestimonialsState => {
  const { data: testimonials, loading, source } = useCsvData<
    MentorshipTestimonial,
    MentorshipTestimonial[]
  >({
    url: import.meta.env.VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL,
    requiredColumns: testimonialColumns,
    initialData: emptyTestimonials,
    deriveData: deriveTestimonials,
    fallbackError: "Mentorship testimonials could not be loaded.",
  });

  return { testimonials, loading, source };
};
