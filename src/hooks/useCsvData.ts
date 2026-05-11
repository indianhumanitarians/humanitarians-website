import { useEffect, useState } from "react";
import { fetchCsv } from "../services/googleSheets";
import type { DataSourceState } from "../types/stats";

interface UseCsvDataOptions<T, TData> {
  url: string | undefined;
  requiredColumns: string[];
  initialData: TData;
  deriveData: (rows: T[]) => TData;
  fallbackData?: TData;
  fallbackError: string;
}

export interface CsvDataState<TData> {
  data: TData;
  loading: boolean;
  source: DataSourceState;
  error?: string;
}

export const useCsvData = <T extends object, TData>({
  url,
  requiredColumns,
  initialData,
  deriveData,
  fallbackData,
  fallbackError,
}: UseCsvDataOptions<T, TData>): CsvDataState<TData> => {
  const [state, setState] = useState<CsvDataState<TData>>({
    data: fallbackData ?? initialData,
    loading: fallbackData ? false : true,
    source: fallbackData ? "fallback" : "error",
  });

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        if (!url && fallbackData) {
          return;
        }

        const rows = await fetchCsv<T>(url, { requiredColumns });
        const data = deriveData(rows);

        if (isMounted) {
          setState({
            data,
            loading: false,
            source: "live",
          });
        }
      } catch (fetchError) {
        if (isMounted) {
          if (fallbackData) {
            setState({
              data: fallbackData,
              loading: false,
              source: "fallback",
            });
            return;
          }

          setState({
            data: initialData,
            loading: false,
            source: "error",
            error:
              fetchError instanceof Error ? fetchError.message : fallbackError,
          });
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [deriveData, fallbackData, fallbackError, initialData, requiredColumns, url]);

  return state;
};
