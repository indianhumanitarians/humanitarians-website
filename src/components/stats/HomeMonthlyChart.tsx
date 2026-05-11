import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyStat } from "../../types/stats";

interface HomeMonthlyChartProps {
  rows: MonthlyStat[];
}

export const HomeMonthlyChart = ({ rows }: HomeMonthlyChartProps) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart
      data={rows.filter((row) => row.total_cases > 0)}
      margin={{ top: 12, right: 6, left: -22, bottom: 0 }}
    >
      <CartesianGrid vertical={false} stroke="#efe7db" />
      <XAxis
        dataKey="period_label"
        tick={{ fontSize: 10, fill: "#8a8178" }}
        interval="preserveStartEnd"
      />
      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8a8178" }} />
      <Tooltip cursor={{ fill: "rgba(26,92,56,0.08)" }} />
      <Bar
        dataKey="total_cases"
        name="Families helped"
        fill="#1a5c38"
        radius={[5, 5, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);
