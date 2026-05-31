import { useEffect, useState } from "react";
import {
  derivePublicStatsFromLedger,
} from "../services/caseLedgerStats";
import { fetchPublicCaseLedgerRows } from "../services/adminCases";
import type {
  CaseLedgerRow,
  DataSourceState,
  PublicStats,
} from "../types/stats";
import { emptyPublicStats } from "./usePublicStats";

interface ReportPageData {
  stats: PublicStats;
}

interface ReportPageDataState extends ReportPageData {
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

const emptyReportPageData: ReportPageData = {
  stats: emptyPublicStats,
};

const deriveReportPageData = (rows: CaseLedgerRow[]): ReportPageData => ({
  stats: derivePublicStatsFromLedger(rows),
});

export const useReportPageData = (): ReportPageDataState => {
  const [state, setState] = useState<ReportPageDataState>({
    ...emptyReportPageData,
    loading: true,
    source: "live",
  });

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const rows = await fetchPublicCaseLedgerRows();
        const data = deriveReportPageData(rows as CaseLedgerRow[]);

        if (isMounted) {
          setState({
            ...data,
            loading: false,
            source: "live",
          });
        }
      } catch (reportError) {
        if (isMounted) {
          setState({
            ...emptyReportPageData,
            loading: false,
            source: "error",
            error:
              reportError instanceof Error
                ? reportError.message
                : "Supabase reports could not be loaded.",
          });
        }
      }
    };

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
