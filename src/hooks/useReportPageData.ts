import { useEffect, useState } from "react";
import {
  derivePublicStatsFromLedger,
} from "../services/caseLedgerStats";
import { fetchPublicCaseLedgerRows } from "../services/adminCases";
import {
  ACTIVE_DONOR_COMMUNITY_SETTING,
  fetchPublicSiteSettings,
  siteSettingValue,
} from "../services/siteSettings";
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

const deriveReportPageData = (
  rows: CaseLedgerRow[],
  activeDonorCommunity: string,
): ReportPageData => ({
  stats: derivePublicStatsFromLedger(rows, { activeDonorCommunity }),
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
        const [rows, settings] = await Promise.all([
          fetchPublicCaseLedgerRows(),
          fetchPublicSiteSettings().catch(() => []),
        ]);
        const activeDonorCommunity = siteSettingValue(
          settings,
          ACTIVE_DONOR_COMMUNITY_SETTING,
        );
        const data = deriveReportPageData(
          rows as CaseLedgerRow[],
          activeDonorCommunity,
        );

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
