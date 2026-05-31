import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminCases } from "../services/adminCases";
import type { AdminCase } from "../types/admin";

interface AdminCasesState {
  cases: AdminCase[];
  loading: boolean;
  error?: string;
  reload: () => Promise<void>;
}

export const useAdminCases = (token: string | undefined): AdminCasesState => {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | undefined>();

  const loadCases = useCallback(async () => {
    if (!token) {
      setCases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      setCases(await fetchAdminCases(token));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load admin cases.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  return useMemo(
    () => ({
      cases,
      loading,
      error,
      reload: loadCases,
    }),
    [cases, error, loadCases, loading],
  );
};
