export const formatRupees = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const getMetricValue = (summary: { metric: string; value: string | number }[], metric: string): string | number =>
  summary.find((item) => item.metric === metric)?.value ?? "0";
