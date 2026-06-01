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
import { chartTooltipClassName } from "./chartTooltip";

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

interface WrappedYAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
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

const wrapLabel = (label: string, maxCharacters = 14): string[] => {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];

  for (const word of words) {
    const currentLine = lines[lines.length - 1];
    if (!currentLine || `${currentLine} ${word}`.length > maxCharacters) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${currentLine} ${word}`;
    }
  }

  return lines.length > 0 ? lines : [label];
};

const WrappedYAxisTick = ({ x = 0, y = 0, payload }: WrappedYAxisTickProps) => {
  const lines = wrapLabel(String(payload?.value ?? ""));
  const lineHeight = 14;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  return (
    <g transform={`translate(${x},${startY})`}>
      <text textAnchor="end" fill="#57534e" fontSize={12} fontWeight={700}>
        {lines.map((line, index) => (
          <tspan x={0} dy={index === 0 ? 0 : lineHeight} key={`${line}-${index}`}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

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

  const visibleSupportTypes = row.supportTypes.filter(
    (supportType) => supportType.cases > 0,
  );

  return (
    <div className={`${chartTooltipClassName({})} support-tooltip`}>
      <strong>{row.category}</strong>
      <span>{row.cases} families helped</span>
      <span className="support-tooltip-list">
        {visibleSupportTypes.slice(0, 12).map((supportType) => (
          <span key={supportType.support_type}>
            {supportType.support_type}: {supportType.cases}
          </span>
        ))}
      </span>
      {visibleSupportTypes.length > 12 ? (
        <span>+{visibleSupportTypes.length - 12} more support types</span>
      ) : null}
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
    .map<CategorySupportSummary>((row) => ({
      ...row,
      supportTypes: row.supportTypes.sort((a, b) => b.cases - a.cases),
    }))
    .sort((a, b) => b.cases - a.cases || b.total_amount - a.total_amount);
  const maxCategoryCases = Math.max(
    ...categoryRows.map((row) => row.cases),
    0,
  );
  const supportTypeColors = new Map(
    supportTypes.map((supportType, index) => [
      supportType.label,
      SUPPORT_TYPE_PALETTE[index % SUPPORT_TYPE_PALETTE.length],
    ]),
  );
  const getSupportTypeColor = (supportType: string): string =>
    supportTypeColors.get(supportType) ?? SUPPORT_TYPE_PALETTE[0];

  return (
    <article className="chart-card support-type-chart">
      <h3>What kind of help was given most</h3>
      <div className="chart-wrap" aria-hidden="true">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={categoryRows}
            layout="vertical"
            margin={{ top: 12, right: 24, left: 28, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              dataKey="category"
              type="category"
              tick={<WrappedYAxisTick />}
              tickLine={false}
              axisLine={false}
              width={135}
            />
            <Tooltip
              content={<SupportTypeTooltip />}
              wrapperStyle={{ zIndex: 20 }}
            />
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
      <div className="chart-color-legend" aria-label="Support description legend">
        {supportTypes.map((supportType, index) => (
          <span
            key={supportType.key}
            style={{
              color: SUPPORT_TYPE_PALETTE[index % SUPPORT_TYPE_PALETTE.length],
            }}
          >
            <i
              aria-hidden="true"
              style={{
                backgroundColor:
                  SUPPORT_TYPE_PALETTE[index % SUPPORT_TYPE_PALETTE.length],
              }}
            />
            {supportType.label}
          </span>
        ))}
      </div>
      <div className="support-type-mobile-bars" aria-label="Support types by category">
        {categoryRows.map((row) => (
          <div className="support-type-mobile-row" key={row.category}>
            <div className="support-type-mobile-label">
              <span>{row.category}</span>
              <strong>{row.cases}</strong>
            </div>
            <div className="support-type-mobile-stack-track">
              <div
                className="support-type-mobile-stack"
                style={{
                  width:
                    maxCategoryCases > 0
                      ? `${(row.cases / maxCategoryCases) * 100}%`
                      : "0%",
                }}
              >
                {supportTypes.map((supportType, index) => {
                  const cases = Number(row[supportType.key]) || 0;

                  if (cases <= 0 || row.cases <= 0) {
                    return null;
                  }

                  return (
                    <span
                      key={supportType.key}
                      style={{
                        backgroundColor:
                          SUPPORT_TYPE_PALETTE[index % SUPPORT_TYPE_PALETTE.length],
                        width: `${(cases / row.cases) * 100}%`,
                      }}
                      title={`${supportType.label}: ${cases}`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="support-type-mobile-legend">
              {row.supportTypes
                .filter((supportType) => supportType.cases > 0)
                .map((supportType) => (
                  <span key={supportType.support_type}>
                    <i
                      aria-hidden="true"
                      style={{
                        backgroundColor: getSupportTypeColor(
                          supportType.support_type,
                        ),
                      }}
                    />
                    {supportType.support_type}: {supportType.cases}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};
