interface ChartTooltipClassOptions {
  compact?: boolean;
}

export const chartTooltipClassName = ({
  compact = false,
}: ChartTooltipClassOptions): string => {
  return ["chart-tooltip", compact ? "compact" : ""]
    .filter(Boolean)
    .join(" ");
};
