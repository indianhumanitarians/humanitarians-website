import type { DataSourceState } from "./types/stats";

export const formatRupees = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatApproxRupeesBand = (
  value: string | number | undefined,
): string => {
  const amount = toFiniteNumber(value);

  if (amount <= 0) {
    return "Not available";
  }

  if (amount < 5000) {
    return "Under ₹5,000";
  }

  if (amount <= 10000) {
    return "₹5,000-₹10,000";
  }

  if (amount <= 25000) {
    return "₹10,000-₹25,000";
  }

  if (amount <= 50000) {
    return "₹25,000-₹50,000";
  }

  if (amount <= 100000) {
    return "₹50,000-₹1,00,000";
  }

  if (amount <= 250000) {
    return "₹1L-₹2.5L";
  }

  if (amount <= 500000) {
    return "₹2.5L-₹5L";
  }

  if (amount <= 1000000) {
    return "₹5L-₹10L";
  }

  if (amount <= 2500000) {
    return "₹10L-₹25L";
  }

  if (amount <= 5000000) {
    return "₹25L-₹50L";
  }

  return "More than ₹50L";
};

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

  return "Live data unavailable";
};
