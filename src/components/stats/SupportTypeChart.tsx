import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SupportTypeStat } from "../../types/stats";
import { formatRupees } from "../../utils";

interface SupportTypeChartProps {
  rows: SupportTypeStat[];
}

export const SupportTypeChart = ({ rows }: SupportTypeChartProps) => (
  <article className="chart-card">
    <h3>What kind of help was given most</h3>
    <div className="chart-wrap" aria-hidden="true">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 12, right: 24, left: 72, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            dataKey="public_label"
            type="category"
            tick={{ fontSize: 11 }}
            width={110}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) =>
              name === "total_amount"
                ? formatRupees(Number(value) || 0)
                : String(value ?? "")
            }
          />
          <Bar
            dataKey="cases"
            name="Families helped"
            fill="#0284c7"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <p className="sr-summary">
      Text summary: the chart shows which support types helped the most
      families.
    </p>
  </article>
);
