import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyStat } from "../../types/stats";
import { formatRupees } from "../../utils";

interface FundBreakdownChartProps {
  rows: MonthlyStat[];
}

export const FundBreakdownChart = ({ rows }: FundBreakdownChartProps) => {
  const chartRows = rows.map((row) => ({
    ...row,
    amount_zakat: Number(row.amount_zakat) || 0,
    amount_sadaqah: Number(row.amount_sadaqah) || 0,
    other_funds: Number(row.other_funds) || 0,
  }));
  const hasMoneyData = chartRows.some(
    (row) =>
      row.amount_zakat > 0 ||
      row.amount_sadaqah > 0 ||
      row.other_funds > 0,
  );

  return (
    <article className="chart-card">
      <h3>Monthly donations by fund type</h3>
      <div className="chart-wrap" aria-hidden="true">
        {hasMoneyData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartRows}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
              <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(value: number) =>
                  `₹${Math.round(value / 1000)}k`
                }
              />
              <Tooltip
                formatter={(value: unknown) => formatRupees(Number(value) || 0)}
              />
              <Legend />
              <Bar
                dataKey="amount_zakat"
                name="Zakat used"
                stackId="funds"
                fill="#075985"
              />
              <Bar
                dataKey="amount_sadaqah"
                name="Sadaqah used"
                stackId="funds"
                fill="#8b5cf6"
              />
              <Bar
                dataKey="other_funds"
                name="Other funds used"
                stackId="funds"
                fill="#0f766e"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart-state">
            Monthly fund amounts are not available in the public sheet yet.
          </div>
        )}
      </div>
    </article>
  );
};
