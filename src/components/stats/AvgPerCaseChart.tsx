import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminMonthlySummary } from "../../services/adminInsights";
import { formatRupees } from "../../utils";
import { chartTooltipClassName } from "./chartTooltip";

interface AvgPerCaseChartProps {
  rows: AdminMonthlySummary[];
}

interface AvgTooltipProps {
  active?: boolean;
  payload?: { value?: number; payload?: { period_label: string; avg: number; cases: number } }[];
  label?: string;
}

const AvgTooltip = ({ active, payload, label }: AvgTooltipProps) => {
  if (!active || !payload?.length) return null;
  const avg = Number(payload[0]?.value) || 0;
  const cases = Number(payload[0]?.payload?.cases) || 0;
  return (
    <div className={chartTooltipClassName({})}>
      <strong>{label}</strong>
      <span>{cases} cases</span>
      <b>Avg: {formatRupees(avg)}</b>
    </div>
  );
};

export const AvgPerCaseChart = ({ rows }: AvgPerCaseChartProps) => {
  const chartData = rows
    .slice()
    .sort((a, b) => a.period_sort - b.period_sort)
    .map((row) => ({
      period_label: row.period_label,
      avg: row.total_cases > 0 ? Math.round(row.total_amount / row.total_cases) : 0,
      cases: row.total_cases,
    }))
    .filter((row) => row.cases > 0);

  const hasData = chartData.some((row) => row.avg > 0);

  const overallAvg =
    chartData.length > 0
      ? Math.round(chartData.reduce((s, r) => s + r.avg, 0) / chartData.length)
      : 0;

  return (
    <article className="chart-card">
      <h3>Average donation per case per month</h3>
      <div className="chart-wrap" aria-hidden="true">
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="avgLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v: number) => `₹${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<AvgTooltip />} wrapperStyle={{ zIndex: 20 }} />
              {overallAvg > 0 && (
                <ReferenceLine
                  y={overallAvg}
                  stroke="#a8a29e"
                  strokeDasharray="5 4"
                  label={{
                    value: `Avg ${formatRupees(overallAvg)}`,
                    position: "insideTopRight",
                    fontSize: 11,
                    fill: "#78716c",
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="avg"
                name="Avg per case"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#7c3aed", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart-state">No per-case average data yet.</div>
        )}
      </div>
    </article>
  );
};
