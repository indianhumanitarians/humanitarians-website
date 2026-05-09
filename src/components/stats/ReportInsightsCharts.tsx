import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PublicStats } from "../../types/stats";
import { getMetricValue, toFiniteNumber } from "../../utils";

interface ReportInsightsChartsProps {
  stats: PublicStats;
}

const chartColors = ["#0f766e", "#ca8a04", "#be123c", "#2563eb", "#7c3aed", "#475569"];

export const ReportInsightsCharts = ({ stats }: ReportInsightsChartsProps) => {
  const metric = (key: string) => getMetricValue(stats.impactSummary, key);
  const livelihoodCases = toFiniteNumber(metric("livelihood_cases"));
  const skillCases = toFiniteNumber(metric("skill_education_cases"));
  const urgentCases = toFiniteNumber(metric("emergency_community_cases"));
  const zakatCases = toFiniteNumber(metric("zakat_only_cases"));
  const sadaqahCases = toFiniteNumber(metric("sadaqah_only_cases"));
  const mixedCases = toFiniteNumber(metric("mixed_fund_cases"));

  const caseCategoryRows = [
    { name: "Livelihood", value: livelihoodCases },
    { name: "Skill / education", value: skillCases },
    { name: "Emergency / community", value: urgentCases },
  ].filter((row) => row.value > 0);

  const fundCaseRows = [
    { name: "Zakat-only", value: zakatCases },
    { name: "Sadaqah-only", value: sadaqahCases },
    { name: "Mixed fund", value: mixedCases },
  ].filter((row) => row.value > 0);

  return (
    <section className="report-insights-section" aria-label="Report insight charts">
      <div className="report-insights-heading">
        <h2>Case mix</h2>
        <p>
          These two views answer different questions: what kind of help was
          delivered, and which fund route supported the case.
        </p>
      </div>
      <div className="report-pie-cluster">
        <article className="chart-card">
          <h3>Cases by category</h3>
          <div className="chart-wrap" aria-hidden="true">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip />
                <Pie data={caseCategoryRows} dataKey="value" nameKey="name" outerRadius={100} label>
                  {caseCategoryRows.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <h3>Cases by fund type</h3>
          <div className="chart-wrap" aria-hidden="true">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip />
                <Pie data={fundCaseRows} dataKey="value" nameKey="name" innerRadius={56} outerRadius={102} label>
                  {fundCaseRows.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
};
