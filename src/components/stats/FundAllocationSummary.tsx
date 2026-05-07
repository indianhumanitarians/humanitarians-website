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
  const zakat = metricZakat || monthlyZakat;
  const sadaqah = metricSadaqah || monthlySadaqah;
  const total = zakat + sadaqah;
  const zakatPercent = percentage(zakat, total);
  const sadaqahPercent = percentage(sadaqah, total);

  return (
    <section className="fund-allocation-panel" aria-label="Zakat and Sadaqah allocation percentages">
      <div className="fund-allocation-heading">
        <h3>Zakat and Sadaqah split</h3>
        <p>Simple view of how public allocated funds are divided between Zakat and Sadaqah.</p>
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
          <span>Total public allocation</span>
          <strong>{formatRupees(total)}</strong>
          <p>Zakat and Sadaqah are tracked separately in monthly reports.</p>
        </article>
      </div>
    </section>
  );
};
