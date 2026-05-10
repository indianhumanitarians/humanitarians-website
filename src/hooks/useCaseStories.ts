import {
  caseLedgerColumns,
  deriveCaseStoriesFromLedger,
} from "../services/caseLedgerStats";
import { useCsvData } from "./useCsvData";
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

interface CaseStoriesState {
  stories: CaseStory[];
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

const emptyStories: CaseStory[] = [];

export const useCaseStories = (): CaseStoriesState => {
  const { data: stories, loading, source, error } = useCsvData<CaseLedgerRow, CaseStory[]>({
    url: import.meta.env.VITE_STATS_CASE_LEDGER_CSV_URL,
    requiredColumns: caseStoryColumns,
    initialData: emptyStories,
    deriveData: deriveCaseStoriesFromLedger,
    fallbackError: "Case stories could not be derived from CaseLedger.",
  });

  return { stories, loading, source, error };
};
