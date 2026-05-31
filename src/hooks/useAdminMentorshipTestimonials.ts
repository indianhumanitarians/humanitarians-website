import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminMentorshipTestimonials } from "../services/adminCases";
import type { AdminMentorshipTestimonial } from "../types/admin";

interface AdminMentorshipTestimonialsState {
  testimonials: AdminMentorshipTestimonial[];
  loading: boolean;
  error?: string;
  reload: () => Promise<void>;
}

export const useAdminMentorshipTestimonials = (
  token: string | undefined,
): AdminMentorshipTestimonialsState => {
  const [testimonials, setTestimonials] = useState<AdminMentorshipTestimonial[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | undefined>();

  const loadTestimonials = useCallback(async () => {
    if (!token) {
      setTestimonials([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      setTestimonials(await fetchAdminMentorshipTestimonials(token));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load mentorship testimonials.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTestimonials();
  }, [loadTestimonials]);

  return useMemo(
    () => ({
      testimonials,
      loading,
      error,
      reload: loadTestimonials,
    }),
    [error, loadTestimonials, loading, testimonials],
  );
};
