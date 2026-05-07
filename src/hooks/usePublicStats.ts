import { useEffect, useState } from "react";
import {
  fallbackImpactSummary,
  fallbackLastUpdated,
  fallbackMonthlyStats,
  fallbackSupportTypes,
} from "../data/statsFallback";
import { fetchCsv } from "../services/googleSheets";
import type { DataSourceState, ImpactSummaryStat, LastUpdatedStat, MonthlyStat, PublicStats, SupportTypeStat } from "../types/stats";

const monthlyColumns = [
  "period_label",
  "period_sort",
  "total_cases",
  "livelihood_cases",
  "skill_cases",
  "emergency_cases",
  "community_cases",
  "amount_zakat",
  "amount_sadaqah",
  "total_amount",
  "include_in_public",
];

const supportTypeColumns = ["support_type", "cases", "total_amount", "public_label"];
const impactColumns = ["metric", "value", "label", "display_order"];
const lastUpdatedColumns = ["last_updated", "data_through", "note", "source_workbook"];

interface PublicStatsState {
  stats: PublicStats;
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

const fallbackStats: PublicStats = {
  monthly: fallbackMonthlyStats,
  supportTypes: fallbackSupportTypes,
  impactSummary: fallbackImpactSummary,
  lastUpdated: fallbackLastUpdated,
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericValue = Number(value.replace(/[₹,\s]/g, ""));
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  return 0;
};

const normalizeMonthlyRow = (row: MonthlyStat): MonthlyStat => ({
  ...row,
  period_sort: toNumber(row.period_sort),
  total_cases: toNumber(row.total_cases),
  zakat_cases: toNumber(row.zakat_cases),
  sadaqah_cases: toNumber(row.sadaqah_cases),
  mixed_cases: toNumber(row.mixed_cases),
  livelihood_cases: toNumber(row.livelihood_cases),
  skill_cases: toNumber(row.skill_cases),
  emergency_cases: toNumber(row.emergency_cases),
  community_cases: toNumber(row.community_cases),
  amount_zakat: toNumber(row.amount_zakat),
  amount_sadaqah: toNumber(row.amount_sadaqah),
  amount_mixed: toNumber(row.amount_mixed),
  total_amount: toNumber(row.total_amount),
  donations_general: toNumber(row.donations_general),
  donations_zakat: toNumber(row.donations_zakat),
  closing_balance_general: toNumber(row.closing_balance_general),
});

const sortMonthly = (rows: MonthlyStat[]): MonthlyStat[] =>
  rows
    .filter((row) => String(row.include_in_public).toUpperCase() === "TRUE")
    .map(normalizeMonthlyRow)
    .sort((a, b) => a.period_sort - b.period_sort);

const sortImpact = (rows: ImpactSummaryStat[]): ImpactSummaryStat[] =>
  [...rows].sort((a, b) => a.display_order - b.display_order);

const isFulfilled = <T,>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> =>
  result.status === "fulfilled";

export const usePublicStats = (): PublicStatsState => {
  const [state, setState] = useState<PublicStatsState>({
    stats: fallbackStats,
    loading: true,
    source: "fallback",
  });

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      const results = await Promise.allSettled([
          fetchCsv<MonthlyStat>(import.meta.env.VITE_STATS_MONTHLY_CSV_URL, { requiredColumns: monthlyColumns }),
          fetchCsv<SupportTypeStat>(import.meta.env.VITE_STATS_SUPPORT_TYPES_CSV_URL, { requiredColumns: supportTypeColumns }),
          fetchCsv<ImpactSummaryStat>(import.meta.env.VITE_STATS_IMPACT_SUMMARY_CSV_URL, { requiredColumns: impactColumns }),
          fetchCsv<LastUpdatedStat>(import.meta.env.VITE_STATS_LAST_UPDATED_CSV_URL, { requiredColumns: lastUpdatedColumns }),
        ]);

      if (isMounted) {
        const [monthlyResult, supportTypesResult, impactSummaryResult, lastUpdatedResult] = results;
        const successfulFetches = results.filter((result) => result.status === "fulfilled").length;
        const source = successfulFetches === results.length ? "live" : successfulFetches > 0 ? "partial" : "fallback";
        const errors = results
          .filter((result): result is PromiseRejectedResult => result.status === "rejected")
          .map((result) => (result.reason instanceof Error ? result.reason.message : "A public CSV could not be loaded."));

        setState({
          stats: {
            monthly: isFulfilled(monthlyResult) ? sortMonthly(monthlyResult.value) : fallbackMonthlyStats,
            supportTypes: isFulfilled(supportTypesResult) ? supportTypesResult.value : fallbackSupportTypes,
            impactSummary: isFulfilled(impactSummaryResult) ? sortImpact(impactSummaryResult.value) : fallbackImpactSummary,
            lastUpdated: isFulfilled(lastUpdatedResult) ? lastUpdatedResult.value[0] ?? fallbackLastUpdated : fallbackLastUpdated,
          },
          loading: false,
          source,
          error: errors.length > 0 ? errors.join(" ") : undefined,
        });
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
