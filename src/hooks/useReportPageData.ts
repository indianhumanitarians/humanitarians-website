import {
  fallbackCaseLedgerRows,
  fallbackSnapshotLabel,
  fallbackSnapshotLastUpdated,
} from "../data/fallbackSheets";
import {
  caseLedgerColumns,
  derivePublicStatsFromLedger,
  deriveReportsFromLedger,
} from "../services/caseLedgerStats";
import type {
  CaseLedgerRow,
  DataSourceState,
  PublicStats,
  ReportRow,
} from "../types/stats";
import { emptyPublicStats } from "./usePublicStats";
import { useCsvData } from "./useCsvData";

interface ReportPageData {
  rows: ReportRow[];
  stats: PublicStats;
}

interface ReportPageDataState extends ReportPageData {
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

const emptyReportPageData: ReportPageData = {
  rows: [],
  stats: emptyPublicStats,
};

const deriveReportPageData = (rows: CaseLedgerRow[]): ReportPageData => ({
  rows: deriveReportsFromLedger(rows),
  stats: derivePublicStatsFromLedger(rows),
});

const fallbackReportPageData: ReportPageData = {
  ...deriveReportPageData(fallbackCaseLedgerRows),
  stats: {
    ...derivePublicStatsFromLedger(fallbackCaseLedgerRows),
    lastUpdated: {
      last_updated: fallbackSnapshotLastUpdated,
      data_through: "May 2026",
      note: fallbackSnapshotLabel,
      source_workbook: "Bundled CaseLedger snapshot",
    },
  },
};

export const useReportPageData = (): ReportPageDataState => {
  const { data, loading, source, error } = useCsvData<
    CaseLedgerRow,
    ReportPageData
  >({
    url: import.meta.env.VITE_STATS_CASE_LEDGER_CSV_URL,
    requiredColumns: caseLedgerColumns,
    initialData: emptyReportPageData,
    deriveData: deriveReportPageData,
    fallbackData: fallbackReportPageData,
    fallbackError: "Reports could not be derived from CaseLedger.",
  });

  return {
    rows: data.rows,
    stats: data.stats,
    loading,
    source,
    error,
  };
};
