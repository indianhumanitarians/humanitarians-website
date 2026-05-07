import { useEffect, useState } from "react";
import { fetchCsv } from "../services/googleSheets";
import type { DataSourceState, MentorshipTestimonial } from "../types/stats";
import { normalizeImageUrl, toFiniteNumber } from "../utils";

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

const isPublishable = (row: MentorshipTestimonial): boolean =>
  String(row.consent_received).trim() === "Yes" &&
  String(row.publish_status).trim() === "Publish";

const normalizeTestimonial = (row: MentorshipTestimonial): MentorshipTestimonial => ({
  ...row,
  display_order: toFiniteNumber(row.display_order),
  profile_image_url: normalizeImageUrl(String(row.profile_image_url ?? "")),
});

export const useMentorshipTestimonials = (): MentorshipTestimonialsState => {
  const [state, setState] = useState<MentorshipTestimonialsState>({
    testimonials: [],
    loading: true,
    source: "fallback",
  });

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const rows = await fetchCsv<MentorshipTestimonial>(
          import.meta.env.VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL,
          { requiredColumns: testimonialColumns },
        );
        const testimonials = rows
          .filter(isPublishable)
          .map(normalizeTestimonial)
          .sort((a, b) => a.display_order - b.display_order);

        if (isMounted) {
          setState({
            testimonials,
            loading: false,
            source: "live",
          });
        }
      } catch (fetchError) {
        if (isMounted) {
          setState({
            testimonials: [],
            loading: false,
            source: "fallback",
          });
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
