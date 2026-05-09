import { useMemo, useState } from "react";
import type { ReportRow } from "../../types/stats";

interface ReportsTableProps {
  rows: ReportRow[];
}

export const ReportsTable = ({ rows }: ReportsTableProps) => {
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        direction === "desc"
          ? b.period_sort - a.period_sort
          : a.period_sort - b.period_sort,
      ),
    [direction, rows],
  );

  return (
    <div className="report-table-wrap">
      <div className="table-toolbar">
        <h3>Monthly statistics</h3>
        <button
          type="button"
          onClick={() =>
            setDirection((current) => (current === "desc" ? "asc" : "desc"))
          }
        >
          Sort {direction === "desc" ? "oldest first" : "newest first"}
        </button>
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Zakat</th>
            <th>Sadaqah</th>
            <th>Mixed</th>
            <th>Livelihood</th>
            <th>Skills</th>
            <th>Emergency / community</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={`${row.period_sort}-${row.period_label}`}>
              <td>
                <strong>{row.period_label}</strong>
                <span>{row.total_public_summary}</span>
                {row.source_notes ? <em>{row.source_notes}</em> : null}
              </td>
              <td>{row.zakat_cases_count}</td>
              <td>{row.sadaqah_cases_count}</td>
              <td>{row.mixed_cases_count}</td>
              <td>{row.livelihood_cases_count}</td>
              <td>{row.skill_or_education_cases_count}</td>
              <td>{row.emergency_community_cases_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
