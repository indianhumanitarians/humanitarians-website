import type { DataSourceState } from "./types/stats";

export const formatRupees = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const getMetricValue = (summary: { metric: string; value: string | number }[], metric: string): string | number =>
  summary.find((item) => item.metric === metric)?.value ?? "0";

export const toFiniteNumber = (value: string | number | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const numericValue = Number(value.replace(/[₹,+\s]/g, ""));
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  return 0;
};

export const normalizeImageUrl = (url: string): string => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return "";
  }

  const fileMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  const idMatch = trimmedUrl.match(/[?&]id=([^&]+)/);
  const fileId = fileMatch?.[1] ?? idMatch?.[1];

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;
  }

  return trimmedUrl;
};

export const getDataSourceLabel = (
  source: DataSourceState,
  liveLabel = "Live data",
): string => {
  if (source === "live") {
    return liveLabel;
  }

  if (source === "partial") {
    return "Live data partial";
  }

  if (source === "fallback") {
    return "Snapshot through May 2026";
  }

  return "Live data unavailable";
};
