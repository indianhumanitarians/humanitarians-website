import { useMemo } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { AvgPerCaseChart } from "../components/stats/AvgPerCaseChart";
import { CategoryRadialChart } from "../components/stats/CategoryRadialChart";
import { CumulativeDisbursementChart } from "../components/stats/CumulativeDisbursementChart";
import { DashboardStatsInfographic } from "../components/stats/DashboardStatsInfographic";
import { DownloadDashboardPdf } from "../components/admin/DownloadDashboardPdf";
import { FundBreakdownChart } from "../components/stats/FundBreakdownChart";
import { FundingMixDonut } from "../components/stats/FundingMixDonut";
import { MonthlyCasesChart } from "../components/stats/MonthlyCasesChart";
import { SupportTypeChart } from "../components/stats/SupportTypeChart";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminCases } from "../hooks/useAdminCases";
import { deriveAdminInsights } from "../services/adminInsights";
import type { AdminMonthlySummary } from "../services/adminInsights";
import { formatRupees } from "../utils";

const percent = (value: number, total: number): string =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";

const csvValue = (value: string | number | boolean | null | undefined): string => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const monthlyExportColumns: Array<{
  label: string;
  value: (item: AdminMonthlySummary) => string | number;
}> = [
  { label: "Period", value: (item) => item.period_label },
  { label: "Period sort", value: (item) => item.period_sort },
  { label: "Cases", value: (item) => item.total_cases },
  { label: "Zakat cases", value: (item) => item.zakat_cases },
  { label: "Sadaqah cases", value: (item) => item.sadaqah_cases },
  { label: "Mixed cases", value: (item) => item.mixed_cases },
  { label: "Other fund cases", value: (item) => item.other_fund_cases },
  { label: "Zakat amount", value: (item) => item.zakat_amount },
  { label: "Sadaqah amount", value: (item) => item.sadaqah_amount },
  { label: "Other amount", value: (item) => item.other_amount },
  { label: "Total donation", value: (item) => item.total_amount },
  { label: "Public stats cases", value: (item) => item.public_stats_cases },
  { label: "Published story cases", value: (item) => item.published_story_cases },
];

const downloadMonthlyStatsCsv = (rows: AdminMonthlySummary[]): void => {
  const headerRow = monthlyExportColumns
    .map((column) => csvValue(column.label))
    .join(",");
  const dataRows = rows.map((item) =>
    monthlyExportColumns
      .map((column) => csvValue(column.value(item)))
      .join(","),
  );
  const csv = `\uFEFF${[headerRow, ...dataRows].join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "monthly-statistics.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

export const AdminDashboard = () => {
  const { session } = useAdminAuth();
  const { cases, loading, error } = useAdminCases(session?.accessToken);
  const insights = useMemo(() => deriveAdminInsights(cases), [cases]);
  const latestMonthlyRows = [...insights.monthly].reverse();

  return (
    <AdminShell
      title="Dashboard"
      eyebrow="Admin insights"
      actions={
        <>
          <AdminTopActions />
          <DownloadDashboardPdf disabled={loading} />
        </>
      }
    >
      {loading ? <p className="soft-status">Loading dashboard insights...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      <section className="admin-kpi-grid">
        <article>
          <span>Total cases</span>
          <strong>{cases.length}</strong>
        </article>
        <article>
          <span>Total donation amount</span>
          <strong>{formatRupees(insights.totalAmount)}</strong>
        </article>
        <article>
          <span>Zakat amount</span>
          <strong>{formatRupees(insights.zakatAmount)}</strong>
        </article>
        <article>
          <span>Sadaqah amount</span>
          <strong>{formatRupees(insights.sadaqahAmount)}</strong>
        </article>
        <article>
          <span>Other funds</span>
          <strong>{formatRupees(insights.otherAmount)}</strong>
        </article>
        <article>
          <span>Average per case</span>
          <strong>{formatRupees(insights.averageCaseAmount)}</strong>
        </article>
        <article>
          <span>Public stats</span>
          <strong>{insights.publicStatsCases}</strong>
        </article>
        <article>
          <span>Published stories</span>
          <strong>{insights.publishedStoryCases}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Fund allocation insights</h3>
        </div>
        <div className="admin-insight-grid">
          {insights.fundTypes.map((item) => (
            <article key={item.fund_type}>
              <span>{item.fund_type}</span>
              <strong>{formatRupees(item.total_amount)}</strong>
              <p>
                {item.cases} cases · {percent(item.total_amount, insights.totalAmount)} of exact tracked funds
              </p>
            </article>
          ))}
        </div>
      </section>

      {insights.monthlyChartRows.length > 0 ? (
        <section className="chart-grid admin-chart-grid">
          <FundBreakdownChart rows={insights.monthlyChartRows} />
          <MonthlyCasesChart rows={insights.monthlyChartRows} />
          <SupportTypeChart rows={insights.supportTypes} />
        </section>
      ) : null}

      {/* ── New rich visualisations ── */}
      <DashboardStatsInfographic insights={insights} />

      {insights.monthlyChartRows.length > 0 ? (
        <section className="chart-grid admin-chart-grid">
          <CumulativeDisbursementChart rows={insights.monthly} />
          <AvgPerCaseChart rows={insights.monthly} />
          <FundingMixDonut
            rows={insights.fundTypes}
            totalAmount={insights.totalAmount}
          />
          <CategoryRadialChart categories={insights.categories} />
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Monthly statistics</h3>
          <button
            type="button"
            className="admin-small-button"
            disabled={latestMonthlyRows.length === 0}
            onClick={() => downloadMonthlyStatsCsv(latestMonthlyRows)}
          >
            Download CSV
          </button>
        </div>
        {latestMonthlyRows.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-monthly-table">
              <colgroup>
                <col className="admin-period-col" />
                <col className="admin-count-col" />
                <col className="admin-count-col" />
                <col className="admin-count-col" />
                <col className="admin-count-col" />
                <col className="admin-count-col" />
                <col className="admin-amount-col" />
                <col className="admin-amount-col" />
                <col className="admin-amount-col" />
                <col className="admin-amount-col" />
                <col className="admin-public-col" />
              </colgroup>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Cases</th>
                  <th>Zakat cases</th>
                  <th>Sadaqah cases</th>
                  <th>Mixed cases</th>
                  <th>Other fund cases</th>
                  <th>Zakat amount</th>
                  <th>Sadaqah amount</th>
                  <th>Other amount</th>
                  <th>Total donation</th>
                  <th>Public</th>
                </tr>
              </thead>
              <tbody>
                {latestMonthlyRows.map((item) => (
                  <tr key={`${item.period_sort}-${item.period_label}`}>
                    <td className="admin-nowrap-cell">
                      <strong>{item.period_label}</strong>
                    </td>
                    <td className="admin-nowrap-cell">{item.total_cases}</td>
                    <td className="admin-nowrap-cell">{item.zakat_cases}</td>
                    <td className="admin-nowrap-cell">{item.sadaqah_cases}</td>
                    <td className="admin-nowrap-cell">{item.mixed_cases}</td>
                    <td className="admin-nowrap-cell">{item.other_fund_cases}</td>
                    <td className="admin-money-cell">{formatRupees(item.zakat_amount)}</td>
                    <td className="admin-money-cell">{formatRupees(item.sadaqah_amount)}</td>
                    <td className="admin-money-cell">{formatRupees(item.other_amount)}</td>
                    <td className="admin-money-cell">{formatRupees(item.total_amount)}</td>
                    <td className="admin-nowrap-cell">
                      <span className="status-pill on">
                        {item.public_stats_cases} stats
                      </span>
                      <span className="status-pill on">
                        {item.published_story_cases} stories
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No monthly case data is available yet.</p>
        )}
      </section>

      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Category insights</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Cases</th>
                <th>Total</th>
                <th>Public</th>
              </tr>
            </thead>
            <tbody>
              {insights.categories.map((item) => (
                <tr key={item.category}>
                  <td className="admin-text-cell">{item.category}</td>
                  <td className="admin-nowrap-cell">{item.cases}</td>
                  <td className="admin-money-cell">{formatRupees(item.total_amount)}</td>
                  <td className="admin-nowrap-cell">
                    <span className="status-pill on">
                      {item.public_stats_cases} stats
                    </span>
                    <span className="status-pill on">
                      {item.published_story_cases} stories
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
};
