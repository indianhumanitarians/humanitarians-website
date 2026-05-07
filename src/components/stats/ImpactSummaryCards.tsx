import type { ImpactSummaryStat } from "../../types/stats";
import { formatRupees } from "../../utils";

interface ImpactSummaryCardsProps {
  rows: ImpactSummaryStat[];
}

const formatValue = (metric: string, value: string | number): string => {
  if (typeof value === "number" && metric.includes("amount")) {
    return formatRupees(value);
  }
  return String(value);
};

export const ImpactSummaryCards = ({ rows }: ImpactSummaryCardsProps) => (
  <div className="impact-grid">
    {rows.map((row) => (
      <article className="impact-card" key={row.metric}>
        <strong>{formatValue(row.metric, row.value)}</strong>
        <span>{row.label}</span>
        {row.source_note ? <p>{row.source_note}</p> : null}
      </article>
    ))}
  </div>
);
