import { useEffect, useState } from "react";
import { fallbackCaseStories } from "../data/statsFallback";
import { fetchCsv } from "../services/googleSheets";
import type { CaseStory, DataSourceState } from "../types/stats";

const caseStoryColumns = [
  "case_id",
  "title",
  "anonymized_name",
  "category",
  "support_type",
  "fund_type",
  "period_label",
  "public_location",
  "amount_range",
  "need",
  "support_provided",
  "outcome",
  "follow_up",
  "quote_placeholder",
  "privacy_note",
  "story_candidate",
  "publish_status",
];

const isPresent = (value: unknown): boolean => String(value ?? "").trim().length > 0;

const matches = (value: unknown, expected: string): boolean =>
  String(value ?? "").trim().toLowerCase() === expected.toLowerCase();

const hasPublishedColumn = (row: CaseStory): boolean =>
  Object.prototype.hasOwnProperty.call(row, "published");

const isPublishableCaseStory = (row: CaseStory): boolean => {
  if (!isPresent(row.case_id) || !isPresent(row.title)) {
    return false;
  }

  if (hasPublishedColumn(row)) {
    return matches(row.published, "Yes") && matches(row.publish_status, "Publish");
  }

  return matches(row.publish_status, "Publish");
};

export const useCaseStories = () => {
  const [stories, setStories] = useState<CaseStory[]>(fallbackCaseStories);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DataSourceState>("fallback");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const rows = await fetchCsv<CaseStory>(import.meta.env.VITE_STATS_CASE_STORIES_CSV_URL, {
          requiredColumns: caseStoryColumns,
        });
        const publicRows = rows.filter(isPublishableCaseStory);

        if (isMounted) {
          setStories(publicRows);
          setSource("live");
          setLoading(false);
        }
      } catch (fetchError) {
        if (isMounted) {
          setStories(fallbackCaseStories);
          setSource("fallback");
          setError(fetchError instanceof Error ? fetchError.message : "Case stories could not be loaded.");
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
