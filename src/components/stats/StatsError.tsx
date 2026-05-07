interface StatsErrorProps {
  title?: string;
}

export const StatsError = ({
  title = "Live stats could not be loaded right now. Showing latest saved public summary.",
}: StatsErrorProps) => (
  <div className="stats-error" role="status">
    <strong>{title}</strong>
  </div>
);
