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
  const [state, setState] = useState<PublicStatsState>({
    stats: emptyPublicStats,
    loading: true,
    source: "live",
  });

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const [rows, settings] = await Promise.all([
          fetchPublicCaseLedgerRows(),
          fetchPublicSiteSettings().catch(() => []),
        ]);
        const activeDonorCommunity = siteSettingValue(
          settings,
          ACTIVE_DONOR_COMMUNITY_SETTING,
        );
        if (isMounted) {
          setState({
            stats: derivePublicStatsFromLedger(rows as CaseLedgerRow[], {
              activeDonorCommunity,
            }),
            loading: false,
            source: "live",
          });
        }
      } catch (statsError) {
        if (isMounted) {
          setState({
            stats: emptyPublicStats,
            loading: false,
            source: "error",
            error:
              statsError instanceof Error
                ? statsError.message
                : "Supabase public stats could not be loaded.",
          });
        }
      }
    };

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
