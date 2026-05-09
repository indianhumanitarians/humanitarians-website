import { usePublicStats } from "../../hooks/usePublicStats";
import { getMetricValue } from "../../utils";

const snapshotMetrics = [
  { metric: "active_donor_community", label: "Active donor community" },
  { metric: "total_public_cases", label: "Public cases tracked" },
  { metric: "livelihood_cases", label: "Livelihood cases" },
  { metric: "zakat_only_cases", label: "Zakat cases tracked" },
  { metric: "sadaqah_only_cases", label: "Sadaqah cases tracked" },
];

export const ImpactSnapshot = () => {
  const { stats, loading, source } = usePublicStats();
  const hasStats = stats.impactSummary.length > 0;

  if (loading) {
    return <p className="soft-status">Loading live public stats...</p>;
  }

  if (!hasStats) {
    return <p className="empty-state">Live public stats are not available right now.</p>;
  }

  return (
    <div className="impact-preview">
      {snapshotMetrics.map((item) => (
        <article key={item.metric}>
          <strong>{String(getMetricValue(stats.impactSummary, item.metric))}</strong>
          <span>{item.label}</span>
        </article>
      ))}
      <p className={`impact-source-pill ${source}`}>{source === "live" ? "Live stats" : "Live data partial"}</p>
    </div>
  );
};
