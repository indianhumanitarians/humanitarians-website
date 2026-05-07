interface KpiStatCardProps {
  label: string;
  value: string;
  detail?: string;
}

export const KpiStatCard = ({ label, value, detail }: KpiStatCardProps) => (
  <article className="kpi-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail ? <p>{detail}</p> : null}
  </article>
);
