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
import type { SupportTypeStat } from "../../types/stats";

interface SupportTypeChartProps {
  rows: SupportTypeStat[];
}

interface CategorySupportSummary {
  [key: string]: string | number | { support_type: string; cases: number }[];
  category: string;
  cases: number;
  total_amount: number;
  supportTypes: {
    support_type: string;
    cases: number;
  }[];
}

interface DynamicSupportType {
  key: string;
  label: string;
}

interface SupportTypeTooltipProps {
  active?: boolean;
  payload?: {
    payload?: CategorySupportSummary;
  }[];
}

const SUPPORT_TYPE_PALETTE = [
  "#0284c7",
  "#166534",
  "#c99a37",
  "#be123c",
  "#7c3aed",
  "#0f766e",
  "#b45309",
  "#4338ca",
  "#4d7c0f",
  "#c2410c",
];

const supportTypeKey = (supportType: string): string =>
  `support_${supportType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;

const SupportTypeTooltip = ({
  active,
  payload,
}: SupportTypeTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0]?.payload;
  if (!row) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <strong>{row.category}</strong>
      <span>{row.cases} families helped</span>
      {row.supportTypes
        .filter((supportType) => supportType.cases > 0)
        .map((supportType) => (
          <span key={supportType.support_type}>
            {supportType.support_type}: {supportType.cases}
          </span>
        ))}
    </div>
  );
};

export const SupportTypeChart = ({ rows }: SupportTypeChartProps) => {
  const supportTypes: DynamicSupportType[] = Array.from(
    new Map(
      rows
        .map((row) => row.support_type.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((supportType) => [
          supportTypeKey(supportType),
          { key: supportTypeKey(supportType), label: supportType },
        ]),
    ).values(),
  );

  const categoryRows = Object.values(
    rows.reduce<Record<string, CategorySupportSummary>>((accumulator, row) => {
      const category = row.category.trim();
      const supportType = row.support_type.trim();

      if (!category) {
        return accumulator;
      }

      accumulator[category] ??= {
        category,
        cases: 0,
        total_amount: 0,
        supportTypes: [],
        ...Object.fromEntries(supportTypes.map((type) => [type.key, 0])),
      };
      accumulator[category].cases += Number(row.cases) || 0;
      accumulator[category].total_amount += Number(row.total_amount) || 0;
      if (supportType) {
        const key = supportTypeKey(supportType);
        accumulator[category][key] =
          Number(accumulator[category][key]) + (Number(row.cases) || 0);
        accumulator[category].supportTypes.push({
          support_type: supportType,
          cases: Number(row.cases) || 0,
        });
      }

      return accumulator;
    }, {}),
  )
    .map((row) => ({
      ...row,
      supportTypes: row.supportTypes.sort((a, b) => b.cases - a.cases),
    }))
    .sort((a, b) => b.cases - a.cases || b.total_amount - a.total_amount);

  return (
    <article className="chart-card">
      <h3>What kind of help was given most</h3>
      <div className="chart-wrap" aria-hidden="true">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={categoryRows}
            layout="vertical"
            margin={{ top: 12, right: 24, left: 72, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              dataKey="category"
              type="category"
              tick={{ fontSize: 11 }}
              width={110}
            />
            <Tooltip content={<SupportTypeTooltip />} />
            <Legend />
            {supportTypes.map((supportType, index) => (
              <Bar
                dataKey={supportType.key}
                name={supportType.label}
                stackId="support-types"
                fill={SUPPORT_TYPE_PALETTE[index % SUPPORT_TYPE_PALETTE.length]}
                key={supportType.key}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};
