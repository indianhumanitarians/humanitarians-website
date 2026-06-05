import type { AdminInsights, AdminMonthlySummary } from "../../services/adminInsights";
import { formatRupees } from "../../utils";

interface DashboardStatsInfographicProps {
  insights: AdminInsights;
}

// Sparkline SVG path from an array of values
const buildSparklinePath = (values: number[], w = 120, h = 36): string => {
  if (values.length < 2) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${pts.join("L")}`;
};

const Sparkline = ({
  values,
  color = "#0f766e",
}: {
  values: number[];
  color?: string;
}) => {
  const path = buildSparklinePath(values);
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 120 36"
      width={120}
      height={36}
      aria-hidden="true"
      className="sparkline-svg"
    >
      <path d={path} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const trendLabel = (rows: AdminMonthlySummary[], key: keyof AdminMonthlySummary): string => {
  if (rows.length < 2) return "";
  const last = Number(rows[rows.length - 1][key]) || 0;
  const prev = Number(rows[rows.length - 2][key]) || 0;
  if (prev === 0) return "";
  const delta = ((last - prev) / prev) * 100;
  return delta >= 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;
};

const trendDir = (rows: AdminMonthlySummary[], key: keyof AdminMonthlySummary): "up" | "down" | "flat" => {
  if (rows.length < 2) return "flat";
  const last = Number(rows[rows.length - 1][key]) || 0;
  const prev = Number(rows[rows.length - 2][key]) || 0;
  if (last > prev) return "up";
  if (last < prev) return "down";
  return "flat";
};

export const DashboardStatsInfographic = ({
  insights,
}: DashboardStatsInfographicProps) => {
  const sorted = [...insights.monthly].sort((a, b) => a.period_sort - b.period_sort);
  const totalCases = insights.monthly.reduce((s, r) => s + r.total_cases, 0);
  const publicRate =
    totalCases > 0
      ? Math.round((insights.publicStatsCases / totalCases) * 100)
      : 0;
  const storyRate =
    totalCases > 0
      ? Math.round((insights.publishedStoryCases / totalCases) * 100)
      : 0;

  const casesValues = sorted.map((r) => r.total_cases);
  const amountValues = sorted.map((r) => r.total_amount);

  const latestMonth = sorted[sorted.length - 1];
  const prevMonth = sorted[sorted.length - 2];

  const momCasesTrend = trendLabel(sorted, "total_cases");
  const momCasesDir = trendDir(sorted, "total_cases");
  const momAmountTrend = trendLabel(sorted, "total_amount");
  const momAmountDir = trendDir(sorted, "total_amount");

  return (
    <section className="admin-panel admin-infographic-panel">
      <div className="table-toolbar">
        <h3>Live performance indicators</h3>
      </div>
      <div className="infographic-grid">
        {/* Publication rate gauge */}
        <div className="infographic-card gauge-card">
          <h4>Public visibility rate</h4>
          <div className="gauge-pair">
            <div className="gauge-item">
              <svg viewBox="0 0 120 70" width={120} height={70} aria-hidden="true">
                <path
                  d="M10,65 A50,50 0 0,1 110,65"
                  fill="none"
                  stroke="#e7e5e4"
                  strokeWidth={12}
                  strokeLinecap="round"
                />
                {publicRate > 0 && (
                  <path
                    d="M10,65 A50,50 0 0,1 110,65"
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeDasharray={`${(publicRate / 100) * 157.08} 157.08`}
                  />
                )}
                <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="900" fill="#19211d">
                  {publicRate}%
                </text>
              </svg>
              <span>In public stats</span>
            </div>
            <div className="gauge-item">
              <svg viewBox="0 0 120 70" width={120} height={70} aria-hidden="true">
                <path
                  d="M10,65 A50,50 0 0,1 110,65"
                  fill="none"
                  stroke="#e7e5e4"
                  strokeWidth={12}
                  strokeLinecap="round"
                />
                {storyRate > 0 && (
                  <path
                    d="M10,65 A50,50 0 0,1 110,65"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeDasharray={`${(storyRate / 100) * 157.08} 157.08`}
                  />
                )}
                <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="900" fill="#19211d">
                  {storyRate}%
                </text>
              </svg>
              <span>Published stories</span>
            </div>
          </div>
        </div>

        {/* MoM cases velocity */}
        <div className="infographic-card velocity-card">
          <h4>Month-on-month velocity</h4>
          <div className="velocity-grid">
            <div className="velocity-item">
              <Sparkline values={casesValues} color="#0f766e" />
              <div className="velocity-meta">
                <strong>{latestMonth?.total_cases ?? "—"}</strong>
                <span>Cases in {latestMonth?.period_label?.split(" ")[0] ?? "this month"}</span>
                {momCasesTrend && (
                  <span
                    className={`velocity-badge ${momCasesDir === "up" ? "up" : momCasesDir === "down" ? "down" : ""}`}
                  >
                    {momCasesDir === "up" ? "▲" : momCasesDir === "down" ? "▼" : "•"}{" "}
                    {momCasesTrend} vs prior month
                  </span>
                )}
              </div>
            </div>
            <div className="velocity-item">
              <Sparkline values={amountValues} color="#7c3aed" />
              <div className="velocity-meta">
                <strong>{formatRupees(latestMonth?.total_amount ?? 0)}</strong>
                <span>Disbursed in {latestMonth?.period_label?.split(" ")[0] ?? "this month"}</span>
                {momAmountTrend && (
                  <span
                    className={`velocity-badge ${momAmountDir === "up" ? "up" : momAmountDir === "down" ? "down" : ""}`}
                  >
                    {momAmountDir === "up" ? "▲" : momAmountDir === "down" ? "▼" : "•"}{" "}
                    {momAmountTrend} vs prior month
                  </span>
                )}
              </div>
            </div>
          </div>
          {prevMonth && (
            <p className="velocity-context">
              Prior month ({prevMonth.period_label}): {prevMonth.total_cases} cases ·{" "}
              {formatRupees(prevMonth.total_amount)}
            </p>
          )}
        </div>

        {/* Fund type progress bars */}
        <div className="infographic-card fundbar-card">
          <h4>Fund allocation breakdown</h4>
          <div className="fundbar-list">
            {insights.fundTypes.slice(0, 6).map((ft) => {
              const pct =
                insights.totalAmount > 0
                  ? Math.round((ft.total_amount / insights.totalAmount) * 100)
                  : 0;
              const colors: Record<string, string> = {
                zakat: "#0f766e",
                sadaqah: "#7c3aed",
                mixed: "#c99a37",
                other: "#0284c7",
                unspecified: "#a8a29e",
              };
              const color = colors[ft.fund_type.toLowerCase()] ?? "#64748b";
              return (
                <div key={ft.fund_type} className="fundbar-row">
                  <div className="fundbar-labels">
                    <span>{ft.fund_type}</span>
                    <span>{pct}% · {ft.cases} cases</span>
                  </div>
                  <div className="fundbar-track">
                    <div
                      className="fundbar-fill"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="fundbar-amount">{formatRupees(ft.total_amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
