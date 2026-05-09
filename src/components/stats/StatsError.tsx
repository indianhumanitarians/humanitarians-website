interface StatsErrorProps {
  title?: string;
}

export const StatsError = ({
  title = "Live stats could not be loaded right now.",
}: StatsErrorProps) => (
  <div className="stats-error" role="status">
    <strong>{title}</strong>
  </div>
);
