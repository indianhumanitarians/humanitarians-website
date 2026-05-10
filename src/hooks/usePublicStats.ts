import {
  caseLedgerColumns,
  derivePublicStatsFromLedger,
} from "../services/caseLedgerStats";
import { useCsvData } from "./useCsvData";
import type { CaseLedgerRow, DataSourceState, PublicStats } from "../types/stats";

export interface PublicStatsState {
  stats: PublicStats;
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

export const emptyPublicStats: PublicStats = {
  monthly: [],
  supportTypes: [],
  fundTypes: [],
  impactSummary: [],
  lastUpdated: {
    last_updated: "",
    data_through: "",
    note: "",
    source_workbook: "",
  },
};

export const usePublicStats = (): PublicStatsState => {
  const { data: stats, loading, source, error } = useCsvData<CaseLedgerRow, PublicStats>({
    url: import.meta.env.VITE_STATS_CASE_LEDGER_CSV_URL,
    requiredColumns: caseLedgerColumns,
    initialData: emptyPublicStats,
    deriveData: derivePublicStatsFromLedger,
    fallbackError: "CaseLedger could not be loaded.",
  });

  return { stats, loading, source, error };
};
