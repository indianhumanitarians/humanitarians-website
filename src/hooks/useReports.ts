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

const isPresent = (value: unknown): boolean => String(value ?? "").trim().length > 0;

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const numericValue = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeReport = (row: ReportRow): ReportRow => ({
  ...row,
  period_sort: toNumber(row.period_sort),
  zakat_cases_count: toNumber(row.zakat_cases_count),
  sadaqah_cases_count: toNumber(row.sadaqah_cases_count),
  mixed_cases_count: toNumber(row.mixed_cases_count),
  livelihood_cases_count: toNumber(row.livelihood_cases_count),
  skill_or_education_cases_count: toNumber(row.skill_or_education_cases_count),
  emergency_community_cases_count: toNumber(row.emergency_community_cases_count),
});

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
        const publicReports = reports
          .filter((row) => isPresent(row.period_label))
          .map(normalizeReport);

        if (isMounted) {
          setRows(publicReports);
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
