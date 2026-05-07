import { site } from "../../data/site";
import { usePublicStats } from "../../hooks/usePublicStats";
import { formatRupees, getMetricValue } from "../../utils";
import { PrivacyNote } from "../common/PrivacyNote";
import { SectionHeading } from "../common/SectionHeading";
import { FundBreakdownChart } from "./FundBreakdownChart";
import { ImpactSummaryCards } from "./ImpactSummaryCards";
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
  const zakatAmount = Number(metric("zakat_amount_disbursed"));
  const sadaqahAmount = Number(metric("sadaqah_amount_disbursed"));
  const sourceLabel = source === "live" ? "Live" : source === "partial" ? "Live with saved backup" : "Saved public summary";

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
            <span
              className={`data-badge ${source}`}
            >
              {sourceLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {loading ? <StatsLoading /> : null}
      {error ? (
        <StatsError
          title={
            source === "partial"
              ? "Some live stats could not be loaded. Showing saved backup values where needed."
              : undefined
          }
          detail={
            source === "partial"
              ? error
              : error
          }
        />
      ) : null}
      <PrivacyNote>
        Public stats are aggregated. Recipient dignity and privacy are
        protected.
      </PrivacyNote>

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
          label="Income support cases"
          value={String(metric("livelihood_cases"))}
        />
        <KpiStatCard
          label="Education / skills cases"
          value={String(metric("skill_education_cases"))}
        />
        <KpiStatCard
          label="Zakat used"
          value={
            Number.isFinite(zakatAmount)
              ? formatRupees(zakatAmount)
              : String(metric("zakat_amount_disbursed"))
          }
        />
        <KpiStatCard
          label="Sadaqah used"
          value={
            Number.isFinite(sadaqahAmount)
              ? formatRupees(sadaqahAmount)
              : String(metric("sadaqah_amount_disbursed"))
          }
        />
      </div>

      {isFull ? (
        <>
          <div className="chart-grid">
            <MonthlyCasesChart rows={stats.monthly} />
            <FundBreakdownChart rows={stats.monthly} />
            <SupportTypeChart rows={stats.supportTypes} />
          </div>
          <ImpactSummaryCards rows={stats.impactSummary.filter((row) => row.metric !== "data_through")} />
        </>
      ) : (
        <div className="chart-grid one">
          <MonthlyCasesChart rows={stats.monthly.slice(-8)} />
        </div>
      )}

      <div className="last-updated">
        <strong>Last updated:</strong> {stats.lastUpdated.last_updated} · Data
        through {stats.lastUpdated.data_through}
      </div>
    </section>
  );
};
