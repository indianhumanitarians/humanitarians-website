import type { MonthlyStat } from "../../types/stats";
import { formatRupees, toFiniteNumber } from "../../utils";

interface FundAllocationSummaryProps {
  monthlyRows: MonthlyStat[];
  zakatAmount: string | number;
  sadaqahAmount: string | number;
}

const percentage = (value: number, total: number): number =>
  total > 0 ? Math.round((value / total) * 100) : 0;

export const FundAllocationSummary = ({
  monthlyRows,
  zakatAmount,
  sadaqahAmount,
}: FundAllocationSummaryProps) => {
  const metricZakat = toFiniteNumber(zakatAmount);
  const metricSadaqah = toFiniteNumber(sadaqahAmount);
  const monthlyZakat = monthlyRows.reduce((sum, row) => sum + toFiniteNumber(row.amount_zakat), 0);
  const monthlySadaqah = monthlyRows.reduce((sum, row) => sum + toFiniteNumber(row.amount_sadaqah), 0);
  const other = monthlyRows.reduce((sum, row) => sum + toFiniteNumber(row.other_funds), 0);
  const zakat = metricZakat || monthlyZakat;
  const sadaqah = metricSadaqah || monthlySadaqah;
  const total = zakat + sadaqah + other;
  const zakatPercent = percentage(zakat, total);
  const sadaqahPercent = percentage(sadaqah, total);
  const otherPercent = percentage(other, total);

  return (
    <section className="fund-allocation-panel" aria-label="Fund allocation percentages">
      <div className="fund-allocation-heading">
        <h3>Fund type split</h3>
        <p>Simple view of how public allocated funds are divided across Zakat, Sadaqah, and other funds.</p>
      </div>
      <div className="fund-allocation-grid">
        <article>
          <span>Zakat share</span>
          <strong>{zakatPercent}%</strong>
          <div className="fund-progress" aria-hidden="true">
            <i style={{ width: `${zakatPercent}%` }} />
          </div>
          <p>{formatRupees(zakat)} tracked as Zakat support.</p>
        </article>
        <article>
          <span>Sadaqah share</span>
          <strong>{sadaqahPercent}%</strong>
          <div className="fund-progress sadaqah" aria-hidden="true">
            <i style={{ width: `${sadaqahPercent}%` }} />
          </div>
          <p>{formatRupees(sadaqah)} tracked as Sadaqah support.</p>
        </article>
        <article>
          <span>Other funds share</span>
          <strong>{otherPercent}%</strong>
          <div className="fund-progress other" aria-hidden="true">
            <i style={{ width: `${otherPercent}%` }} />
          </div>
          <p>{formatRupees(other)} tracked as other fund support.</p>
        </article>
      </div>
    </section>
  );
};
