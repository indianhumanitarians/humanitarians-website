import { PrivacyNote } from "../components/common/PrivacyNote";
import { SectionHeading } from "../components/common/SectionHeading";
import { ReportsTable } from "../components/reports/ReportsTable";
import { StatsDashboard } from "../components/stats/StatsDashboard";
import { useReports } from "../hooks/useReports";

const reportItems = [
  "Case type",
  "Fund type",
  "Amount summary",
  "Support provided",
  "Follow-up status where available",
];
const privateItems = [
  "Full names",
  "Phone numbers",
  "Addresses",
  "Bank details",
  "ID documents",
  "Sensitive medical/private details",
  "Donor names",
];

export const Reports = () => {
  const { rows, loading, source, error } = useReports();

  return (
    <main className="container page">
      <div className="report-page-hero">
        <SectionHeading
          title="Public Zakat & Sadaqah case reports"
          content="Every month, we share a public summary of handled Zakat and Sadaqah cases with our donor community."
        />
        <span
          className={`data-badge ${source === "live" ? "live" : "fallback"}`}
        >
          {source === "live" ? "Live" : "Saved public summary"}
        </span>
      </div>
      {loading ? (
        <p className="soft-status">Loading report archive...</p>
      ) : null}
      {error ? (
        <p className="soft-status">
          Live reports could not be loaded right now. Showing latest saved
          public summary.
        </p>
      ) : null}
      <StatsDashboard
        variant="full"
        showHeader={false}
        showSourceBadge={false}
      />
      <ReportsTable rows={rows} />
      <section className="section two-col">
        <div className="report-info-panel">
          <h2>What we report</h2>
          <ul className="clean-list">
            {reportItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="report-info-panel">
          <h2>What we do not publish</h2>
          <ul className="clean-list">
            {privateItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};
