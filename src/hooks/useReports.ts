import { useEffect, useState } from "react";
import {
  caseLedgerColumns,
  deriveReportsFromLedger,
} from "../services/caseLedgerStats";
import { fetchCsv } from "../services/googleSheets";
import type { CaseLedgerRow, DataSourceState, ReportRow } from "../types/stats";

export const useReports = () => {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DataSourceState>("error");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const ledgerRows = await fetchCsv<CaseLedgerRow>(
          import.meta.env.VITE_STATS_CASE_LEDGER_CSV_URL,
          { requiredColumns: caseLedgerColumns },
        );

        if (isMounted) {
          setRows(deriveReportsFromLedger(ledgerRows));
          setSource("live");
          setLoading(false);
        }
      } catch (fetchError) {
        if (isMounted) {
          setRows([]);
          setSource("error");
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Reports could not be derived from CaseLedger.",
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

  return { rows, loading, source, error };
};
