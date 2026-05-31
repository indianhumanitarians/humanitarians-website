import { useMemo } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminTopActions } from "../components/admin/AdminTopActions";
import { FundBreakdownChart } from "../components/stats/FundBreakdownChart";
import { MonthlyCasesChart } from "../components/stats/MonthlyCasesChart";
import { SupportTypeChart } from "../components/stats/SupportTypeChart";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminCases } from "../hooks/useAdminCases";
import { deriveAdminInsights } from "../services/adminInsights";
import { formatRupees } from "../utils";

const percent = (value: number, total: number): string =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";

export const AdminDashboard = () => {
  const { session } = useAdminAuth();
  const { cases, loading, error } = useAdminCases(session?.accessToken);
  const insights = useMemo(() => deriveAdminInsights(cases), [cases]);
  const latestMonthlyRows = [...insights.monthly].reverse();

  return (
    <AdminShell
      title="Dashboard"
      eyebrow="Admin insights"
      actions={<AdminTopActions />}
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

      <section className="admin-panel">
        <div className="table-toolbar">
          <h3>Monthly statistics</h3>
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
                      <span>Sort: {item.period_sort}</span>
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
