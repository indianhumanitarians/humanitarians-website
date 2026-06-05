import {
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AdminCategorySummary } from "../../services/adminInsights";
import { formatRupees } from "../../utils";
import { chartTooltipClassName } from "./chartTooltip";

interface CategoryRadialProps {
  categories: AdminCategorySummary[];
}

interface RadialTooltipProps {
  active?: boolean;
  payload?: { payload?: AdminCategorySummary & { fill: string; pct: number } }[];
}

const RADIAL_COLORS = [
  "#0f766e",
  "#7c3aed",
  "#c99a37",
  "#0284c7",
  "#be123c",
  "#166534",
  "#b45309",
  "#4338ca",
];

const RadialTooltip = ({ active, payload }: RadialTooltipProps) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className={chartTooltipClassName({})}>
      <strong>{row.category}</strong>
      <span>{row.cases} cases · {row.pct}% of all</span>
      <b>{formatRupees(row.total_amount)}</b>
    </div>
  );
};

export const CategoryRadialChart = ({ categories }: CategoryRadialProps) => {
  const total = categories.reduce((s, c) => s + c.total_amount, 0);
  const data = categories.slice(0, 8).map((cat, i) => ({
    ...cat,
    fill: RADIAL_COLORS[i % RADIAL_COLORS.length],
    pct: total > 0 ? Math.round((cat.total_amount / total) * 100) : 0,
    // recharts radial bar uses this field
    value: cat.total_amount,
  }));

  if (!data.length) {
    return (
      <article className="chart-card">
        <h3>Category disbursement (radial)</h3>
        <div className="empty-chart-state">No category data yet.</div>
      </article>
    );
  }

  return (
    <article className="chart-card">
      <h3>Category disbursement</h3>
      <div className="chart-wrap" aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="22%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              background={{ fill: "#f5f5f4" }}
              cornerRadius={4}
              label={false}
            >
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={RADIAL_COLORS[index % RADIAL_COLORS.length]} />
              ))}
            </RadialBar>
            <Tooltip content={<RadialTooltip />} wrapperStyle={{ zIndex: 20 }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <ul className="radial-legend" aria-label="Category legend">
          {data.map((row, i) => (
            <li key={row.category}>
              <i style={{ backgroundColor: RADIAL_COLORS[i % RADIAL_COLORS.length] }} />
              <span>{row.category}</span>
              <strong>{row.pct}%</strong>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};
