import { usePublicStats } from "../../hooks/usePublicStats";
import { formatRupees, getMetricValue, toFiniteNumber } from "../../utils";
import { SectionHeading } from "../common/SectionHeading";
import { FundAllocationSummary } from "./FundAllocationSummary";
import { FundBreakdownChart } from "./FundBreakdownChart";
import { KpiStatCard } from "./KpiStatCard";
import { MonthlyCasesChart } from "./MonthlyCasesChart";
import { StatsError } from "./StatsError";
import { StatsLoading } from "./StatsLoading";
import { SupportTypeChart } from "./SupportTypeChart";

interface StatsDashboardProps {
  variant: "preview" | "full";
  showHeader?: boolean;
  showSourceBadge?: boolean;
}

export const StatsDashboard = ({
  variant,
  showHeader = true,
  showSourceBadge = true,
}: StatsDashboardProps) => {
  const { stats, loading, source, error } = usePublicStats();
  const isFull = variant === "full";
  const metric = (key: string) => getMetricValue(stats.impactSummary, key);
  const zakatMetric = metric("zakat_amount_disbursed");
  const sadaqahMetric = metric("sadaqah_amount_disbursed");
  const totalAmountMetric = metric("total_amount_disbursed");
  const totalAmount = toFiniteNumber(totalAmountMetric);
  const sourceLabel =
    source === "live"
      ? "Live"
      : source === "partial"
        ? "Live data partial"
        : "Live data unavailable";
  const hasStats =
    stats.impactSummary.length > 0 ||
    stats.monthly.length > 0 ||
    stats.supportTypes.length > 0;

  return (
    <section className="stats-dashboard">
      {showHeader || showSourceBadge ? (
        <div className="dashboard-topline">
          {showHeader ? (
            <SectionHeading
              title="Transparent monthly reporting"
              content="Public numbers, explained simply: see how many families were helped, what kind of support they received, and how Zakat and Sadaqah were used."
            />
          ) : null}
          {showSourceBadge ? (
            <span className={`data-badge ${source}`}>{sourceLabel}</span>
          ) : null}
        </div>
      ) : null}
      {loading ? <StatsLoading /> : null}
      {error ? (
        <StatsError
          title={
            source === "partial"
              ? "Some live stats could not be loaded."
              : undefined
          }
        />
      ) : null}
      {!loading && !hasStats ? (
        <p className="empty-state">
          Live public stats are not available right now.
        </p>
      ) : null}
      {hasStats ? (
        <div className="kpi-grid">
          <KpiStatCard
            label="Active donor community"
            value={String(metric("active_donor_community"))}
          />
          <KpiStatCard
            label="Families publicly tracked"
            value={String(metric("total_public_cases"))}
          />
          <KpiStatCard
            label="Total donation amount"
            value={
              totalAmount > 0
                ? formatRupees(totalAmount)
                : String(totalAmountMetric)
            }
          />
        </div>
      ) : null}

      {hasStats && isFull ? (
        <>
          <FundAllocationSummary
            monthlyRows={stats.monthly}
            zakatAmount={zakatMetric}
            sadaqahAmount={sadaqahMetric}
          />
          <div className="chart-grid">
            <MonthlyCasesChart rows={stats.monthly} />
            <FundBreakdownChart rows={stats.monthly} />
            <SupportTypeChart rows={stats.supportTypes} />
          </div>
        </>
      ) : hasStats ? (
        <div className="chart-grid one">
          <MonthlyCasesChart rows={stats.monthly.slice(-8)} />
        </div>
      ) : null}

      {stats.lastUpdated.last_updated || stats.lastUpdated.data_through ? (
        <div className="last-updated">
          <strong>Last updated:</strong> {stats.lastUpdated.last_updated} · Data
          through {stats.lastUpdated.data_through}
        </div>
      ) : null}
    </section>
  );
};
