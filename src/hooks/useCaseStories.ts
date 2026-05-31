import { useEffect, useState } from "react";
import {
  deriveCaseStoriesFromLedger,
} from "../services/caseLedgerStats";
import { fetchPublicCaseLedgerRows } from "../services/adminCases";
import type { CaseLedgerRow, CaseStory, DataSourceState } from "../types/stats";

interface CaseStoriesState {
  stories: CaseStory[];
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

const emptyStories: CaseStory[] = [];

export const useCaseStories = (): CaseStoriesState => {
  const [state, setState] = useState<CaseStoriesState>({
    stories: emptyStories,
    loading: true,
    source: "live",
  });

  useEffect(() => {
    let isMounted = true;

    const loadStories = async () => {
      try {
        const rows = await fetchPublicCaseLedgerRows();
        if (isMounted) {
          setState({
            stories: deriveCaseStoriesFromLedger(rows as CaseLedgerRow[]),
            loading: false,
            source: "live",
          });
        }
      } catch (storyError) {
        if (isMounted) {
          setState({
            stories: emptyStories,
            loading: false,
            source: "error",
            error:
              storyError instanceof Error
                ? storyError.message
                : "Supabase case stories could not be loaded.",
          });
        }
      }
    };

    void loadStories();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
