import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { FundTypeStat } from "../../types/stats";
import { formatRupees } from "../../utils";
import { chartTooltipClassName } from "./chartTooltip";

interface FundingMixDonutProps {
  rows: FundTypeStat[];
  totalAmount: number;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number;
    payload?: FundTypeStat & { fill: string };
  }[];
}

const DONUT_COLORS: Record<string, string> = {
  zakat: "#0f766e",
  sadaqah: "#7c3aed",
  mixed: "#c99a37",
  other: "#0284c7",
  unspecified: "#a8a29e",
};

const getDonutColor = (fundType: string): string =>
  DONUT_COLORS[fundType.toLowerCase()] ?? "#64748b";

const DonutTooltip = ({ active, payload }: DonutTooltipProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className={chartTooltipClassName({})}>
      <strong>{item.name}</strong>
      <span>{formatRupees(Number(item.value) || 0)}</span>
    </div>
  );
};

export const FundingMixDonut = ({ rows, totalAmount }: FundingMixDonutProps) => {
  const data = rows.map((row) => ({
    ...row,
    name: row.fund_type,
    value: row.total_amount,
    fill: getDonutColor(row.fund_type),
  }));

  if (!data.length || totalAmount === 0) {
    return (
      <article className="chart-card">
        <h3>Fund type mix</h3>
        <div className="empty-chart-state">No fund breakdown data yet.</div>
      </article>
    );
  }

  return (
    <article className="chart-card">
      <h3>Fund type mix</h3>
      <div className="chart-wrap donut-wrap" aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={900}
            >
              {data.map((entry) => (
                <Cell key={entry.fund_type} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} wrapperStyle={{ zIndex: 20 }} />
            <Legend
              formatter={(value: string) => (
                <span style={{ fontSize: 12, fontWeight: 700 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-centre-label">
          <span>Total</span>
          <strong>{formatRupees(totalAmount)}</strong>
        </div>
      </div>
    </article>
  );
};
