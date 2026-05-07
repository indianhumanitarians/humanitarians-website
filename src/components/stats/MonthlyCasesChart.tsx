import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyStat } from "../../types/stats";

interface MonthlyCasesChartProps {
  rows: MonthlyStat[];
}

export const MonthlyCasesChart = ({ rows }: MonthlyCasesChartProps) => {
  const chartRows = rows.map((row) => ({
    ...row,
    urgent_cases: row.emergency_cases + row.community_cases,
  }));

  return (
    <article className="chart-card">
      <h3>How many families were helped each month</h3>
      <div className="chart-wrap" aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartRows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="casesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#111827" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="total_cases" name="All helped families" stroke="#111827" strokeWidth={3} fill="url(#casesGradient)" />
            <Area type="monotone" dataKey="livelihood_cases" name="Income support" stroke="#7c3aed" strokeWidth={3} fill="transparent" />
            <Area type="monotone" dataKey="skill_cases" name="Education or skills" stroke="#166534" strokeWidth={3} fill="transparent" />
            <Area type="monotone" dataKey="urgent_cases" name="Urgent help" stroke="#be123c" strokeWidth={3} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-summary">
        Text summary: the chart compares all helped families, income support, education or skills, and urgent help by month.
      </p>
    </article>
  );
};
