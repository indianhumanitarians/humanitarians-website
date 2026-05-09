import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PublicStats } from "../../types/stats";
import { toFiniteNumber } from "../../utils";

interface ReportInsightsChartsProps {
  stats: PublicStats;
}

const chartColors = [
  "#0f766e",
  "#ca8a04",
  "#be123c",
  "#2563eb",
  "#7c3aed",
  "#475569",
];

export const ReportInsightsCharts = ({ stats }: ReportInsightsChartsProps) => {
  const fundCaseRows = stats.fundTypes
    .map((row) => ({
      name: row.fund_type,
      value: toFiniteNumber(row.cases),
    }))
    .filter((row) => row.name && row.value > 0);

  return (
    <section className="report-insights-section" aria-label="Report insight charts">
      <div className="report-insights-heading">
        <h2>Case mix</h2>
        <p>
          This view shows which fund routes supported public cases.
        </p>
      </div>
      <div className="report-pie-cluster">
        <article className="chart-card">
          <h3>Cases by fund type</h3>
          <div className="chart-wrap" aria-hidden="true">
            {fundCaseRows.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                  <Pie
                    data={fundCaseRows}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={102}
                    label
                  >
                    {fundCaseRows.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">
                Fund type data is not available yet.
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
};
