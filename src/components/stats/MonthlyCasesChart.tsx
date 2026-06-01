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
import type { MonthlyCategoryStat, MonthlyStat } from "../../types/stats";
import { chartTooltipClassName } from "./chartTooltip";

interface MonthlyCasesChartProps {
  rows: MonthlyStat[];
}

interface MonthlyCasesTooltipProps {
  active?: boolean;
  label?: string;
  payload?: {
    color?: string;
    name?: string;
    value?: number;
    payload?: MonthlyStat;
  }[];
}

const CATEGORY_PALETTE = [
  "#c99a37",
  "#166534",
  "#be123c",
  "#0284c7",
  "#7c3aed",
  "#b45309",
  "#0f766e",
  "#c2410c",
  "#4338ca",
  "#4d7c0f",
];

const toTitleCase = (value: string): string =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getDynamicCategories = (rows: MonthlyStat[]): MonthlyCategoryStat[] => {
  const keys = Array.from(
    new Set(
      rows.flatMap((row) =>
        Object.keys(row).filter((key) => key.startsWith("category_")),
      ),
    ),
  );

  return keys
    .map((key) => ({
      key,
      label: toTitleCase(key.replace(/^category_/, "")),
      valueKey: key,
    }))
    .filter((category) => rows.some((row) => Number(row[category.key]) > 0));
};

const MonthlyCasesTooltip = ({
  active,
  label,
  payload,
}: MonthlyCasesTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const nonZeroItems = payload.filter((item) => Number(item.value) > 0);
  const totalCases = Number(payload[0]?.payload?.total_cases) || 0;

  return (
    <div className={chartTooltipClassName({ compact: true })}>
      <strong>{label}</strong>
      {nonZeroItems.map((item) => (
        <span className="chart-tooltip-row" key={item.name}>
          <i aria-hidden="true" style={{ backgroundColor: item.color }} />
          {item.name}: {Number(item.value) || 0}
        </span>
      ))}
      <b>Total cases: {totalCases}</b>
    </div>
  );
};

export const MonthlyCasesChart = ({ rows }: MonthlyCasesChartProps) => {
  const categories = getDynamicCategories(rows);
  const chartRows = rows.map((row) => ({
    ...row,
    ...Object.fromEntries(
      categories.map((category) => [
        category.valueKey,
        Number(row[category.key]) || 0,
      ]),
    ),
  }));

  return (
    <article className="chart-card">
      <h3>Case types supported each month</h3>
      <div className="chart-wrap" aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartRows}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip
              content={<MonthlyCasesTooltip />}
              wrapperStyle={{ zIndex: 20 }}
            />
            <Legend />
            {categories.map((category, index) => (
              <Bar
                dataKey={category.valueKey}
                name={category.label}
                stackId="cases"
                fill={CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]}
                key={category.valueKey}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};
