import { useEffect, useState } from "react";
import { fallbackReports } from "../data/statsFallback";
import { fetchCsv } from "../services/googleSheets";
import type { DataSourceState, ReportRow } from "../types/stats";

const reportColumns = [
  "period_label",
  "period_sort",
  "zakat_cases_count",
  "sadaqah_cases_count",
  "mixed_cases_count",
  "livelihood_cases_count",
  "skill_or_education_cases_count",
  "emergency_community_cases_count",
  "total_public_summary",
  "download_report_url",
  "source_notes",
  "status",
];

export const useReports = () => {
  const [rows, setRows] = useState<ReportRow[]>(fallbackReports);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DataSourceState>("fallback");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const reports = await fetchCsv<ReportRow>(import.meta.env.VITE_STATS_REPORTS_CSV_URL, {
          requiredColumns: reportColumns,
        });

        if (isMounted) {
          setRows(reports);
          setSource("live");
          setLoading(false);
        }
      } catch (fetchError) {
        if (isMounted) {
          setRows(fallbackReports);
          setSource("fallback");
          setError(fetchError instanceof Error ? fetchError.message : "Reports could not be loaded.");
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { rows, loading, source, error };
};
