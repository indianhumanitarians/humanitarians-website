import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminMonthlySummary } from "../../services/adminInsights";
import { formatRupees } from "../../utils";
import { chartTooltipClassName } from "./chartTooltip";

interface CumulativeChartProps {
  rows: AdminMonthlySummary[];
}

interface CumulativeTooltipProps {
  active?: boolean;
  payload?: { value?: number; payload?: { period_label: string; month_total: number } }[];
  label?: string;
}

const CumulativeTooltip = ({ active, payload, label }: CumulativeTooltipProps) => {
  if (!active || !payload?.length) return null;
  const cumulative = Number(payload[0]?.value) || 0;
  const monthly = Number(payload[0]?.payload?.month_total) || 0;
  return (
    <div className={chartTooltipClassName({})}>
      <strong>{label}</strong>
      <span>This month: {formatRupees(monthly)}</span>
      <b>Cumulative: {formatRupees(cumulative)}</b>
    </div>
  );
};

export const CumulativeDisbursementChart = ({ rows }: CumulativeChartProps) => {
  let running = 0;
  const chartData = rows
    .slice()
    .sort((a, b) => a.period_sort - b.period_sort)
    .map((row) => {
      running += row.total_amount;
      return {
        period_label: row.period_label,
        cumulative: running,
        month_total: row.total_amount,
      };
    });

  const hasData = chartData.some((row) => row.cumulative > 0);

  return (
    <article className="chart-card">
      <h3>Cumulative disbursement over time</h3>
      <div className="chart-wrap" aria-hidden="true">
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v: number) => `₹${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CumulativeTooltip />} wrapperStyle={{ zIndex: 20 }} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative disbursed"
                stroke="#0f766e"
                strokeWidth={2.5}
                fill="url(#cumulativeGrad)"
                dot={{ r: 3, fill: "#0f766e" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart-state">No disbursement data available yet.</div>
        )}
      </div>
    </article>
  );
};
