import { useEffect, useState } from "react";
import {
  caseLedgerColumns,
  deriveCaseStoriesFromLedger,
} from "../services/caseLedgerStats";
import { fetchCsv } from "../services/googleSheets";
import type { CaseLedgerRow, CaseStory, DataSourceState } from "../types/stats";

const caseStoryColumns = [
  ...caseLedgerColumns,
  "title",
  "anonymized_name",
  "public_location",
  "amount_range",
  "need",
  "support_provided",
  "outcome",
  "follow_up",
  "quote_placeholder",
  "privacy_note",
];

export const useCaseStories = () => {
  const [stories, setStories] = useState<CaseStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DataSourceState>("error");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const rows = await fetchCsv<CaseLedgerRow>(
          import.meta.env.VITE_STATS_CASE_LEDGER_CSV_URL,
          { requiredColumns: caseStoryColumns },
        );

        if (isMounted) {
          setStories(deriveCaseStoriesFromLedger(rows));
          setSource("live");
          setLoading(false);
        }
      } catch (fetchError) {
        if (isMounted) {
          setStories([]);
          setSource("error");
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Case stories could not be derived from CaseLedger.",
          );
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { stories, loading, source, error };
};
