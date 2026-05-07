interface StatsErrorProps {
  title?: string;
  detail?: string;
}

export const StatsError = ({ title = "Live stats could not be loaded right now. Showing latest saved public summary.", detail }: StatsErrorProps) => (
  <div className="stats-error" role="status">
    <strong>{title}</strong>
    {detail ? <span>{detail}</span> : null}
  </div>
);
