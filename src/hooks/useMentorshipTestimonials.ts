import { useEffect, useState } from "react";
import { fetchPublicMentorshipTestimonials } from "../services/adminCases";
import type { DataSourceState, MentorshipTestimonial } from "../types/stats";
import { normalizeImageUrl } from "../utils";

interface MentorshipTestimonialsState {
  testimonials: MentorshipTestimonial[];
  loading: boolean;
  source: DataSourceState;
}

const isPublishable = (row: MentorshipTestimonial): boolean =>
  String(row.testimonial_id ?? "").trim().length > 0 &&
  row.consent_received === true;

const normalizeTestimonial = (row: MentorshipTestimonial): MentorshipTestimonial => ({
  ...row,
  profile_image_url: normalizeImageUrl(String(row.profile_image_url ?? "")),
});

const deriveTestimonials = (rows: MentorshipTestimonial[]): MentorshipTestimonial[] =>
  rows
    .filter(isPublishable)
    .map(normalizeTestimonial);

const emptyTestimonials: MentorshipTestimonial[] = [];

export const useMentorshipTestimonials = (): MentorshipTestimonialsState => {
  const [state, setState] = useState<MentorshipTestimonialsState>({
    testimonials: emptyTestimonials,
    loading: true,
    source: "live",
  });

  useEffect(() => {
    let isMounted = true;

    const loadTestimonials = async () => {
      try {
        const rows = await fetchPublicMentorshipTestimonials();
        if (isMounted) {
          setState({
            testimonials: deriveTestimonials(rows),
            loading: false,
            source: "live",
          });
        }
      } catch {
        if (isMounted) {
          setState({
            testimonials: emptyTestimonials,
            loading: false,
            source: "error",
          });
        }
      }
    };

    void loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
