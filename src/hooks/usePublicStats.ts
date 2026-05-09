import { useEffect, useState } from "react";
import {
  caseLedgerColumns,
  derivePublicStatsFromLedger,
} from "../services/caseLedgerStats";
import { fetchCsv } from "../services/googleSheets";
import type { CaseLedgerRow, DataSourceState, PublicStats } from "../types/stats";

interface PublicStatsState {
  stats: PublicStats;
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

const emptyStats: PublicStats = {
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
  const [state, setState] = useState<PublicStatsState>({
    stats: emptyStats,
    loading: true,
    source: "error",
  });

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const rows = await fetchCsv<CaseLedgerRow>(
          import.meta.env.VITE_STATS_CASE_LEDGER_CSV_URL,
          { requiredColumns: caseLedgerColumns },
        );

        if (isMounted) {
          setState({
            stats: derivePublicStatsFromLedger(rows),
            loading: false,
            source: "live",
          });
        }
      } catch (fetchError) {
        if (isMounted) {
          setState({
            stats: emptyStats,
            loading: false,
            source: "error",
            error:
              fetchError instanceof Error
                ? fetchError.message
                : "CaseLedger could not be loaded.",
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
