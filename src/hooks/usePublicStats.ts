import { useEffect, useState } from "react";
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

const emptyStats: PublicStats = {
  monthly: [],
  supportTypes: [],
  impactSummary: [],
  lastUpdated: {
    last_updated: "",
    data_through: "",
    note: "",
    source_workbook: "",
  },
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

const isPresent = (value: unknown): boolean => String(value ?? "").trim().length > 0;

const matches = (value: unknown, expected: string): boolean =>
  String(value ?? "").trim().toLowerCase() === expected.toLowerCase();

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
    .filter((row) => isPresent(row.period_label) && matches(row.include_in_public, "TRUE"))
    .map(normalizeMonthlyRow)
    .sort((a, b) => a.period_sort - b.period_sort);

const sortImpact = (rows: ImpactSummaryStat[]): ImpactSummaryStat[] =>
  rows
    .filter((row) => isPresent(row.metric) && isPresent(row.label))
    .sort((a, b) => toNumber(a.display_order) - toNumber(b.display_order));

const normalizeSupportType = (row: SupportTypeStat): SupportTypeStat => ({
  ...row,
  cases: toNumber(row.cases),
  total_amount: toNumber(row.total_amount),
  zakat_amount: toNumber(row.zakat_amount),
  sadaqah_amount: toNumber(row.sadaqah_amount),
  mixed_cases: toNumber(row.mixed_cases),
});

const sortSupportTypes = (rows: SupportTypeStat[]): SupportTypeStat[] =>
  rows
    .filter((row) => isPresent(row.support_type))
    .map(normalizeSupportType)
    .filter((row) => row.cases > 0 || row.total_amount > 0);

const firstLastUpdated = (rows: LastUpdatedStat[]): LastUpdatedStat | undefined =>
  rows.find((row) => isPresent(row.last_updated) || isPresent(row.data_through));

const isFulfilled = <T,>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> =>
  result.status === "fulfilled";

export const usePublicStats = (): PublicStatsState => {
  const [state, setState] = useState<PublicStatsState>({
    stats: emptyStats,
    loading: true,
    source: "error",
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
        const source = successfulFetches === results.length ? "live" : successfulFetches > 0 ? "partial" : "error";
        const failedFetches = results.filter((result) => result.status === "rejected").length;

        setState({
          stats: {
            monthly: isFulfilled(monthlyResult) ? sortMonthly(monthlyResult.value) : [],
            supportTypes: isFulfilled(supportTypesResult) ? sortSupportTypes(supportTypesResult.value) : [],
            impactSummary: isFulfilled(impactSummaryResult) ? sortImpact(impactSummaryResult.value) : [],
            lastUpdated: isFulfilled(lastUpdatedResult) ? firstLastUpdated(lastUpdatedResult.value) ?? emptyStats.lastUpdated : emptyStats.lastUpdated,
          },
          loading: false,
          source,
          error: failedFetches > 0 ? "One or more live public CSV sheets could not be loaded." : undefined,
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
