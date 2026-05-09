import Papa from "papaparse";

export interface FetchCsvOptions {
  requiredColumns: string[];
}

const numericPattern = /^-?\d+(\.\d+)?$/;

const isPlaceholderUrl = (url: string): boolean =>
  url.trim() === "" || url.includes("PASTE_PUBLIC_");

const withCacheBuster = (url: string): string => {
  const version = Math.floor(Date.now() / 300000);
  return `${url}${url.includes("?") ? "&" : "?"}v=${version}`;
};

const shouldRetryWithoutCacheBuster = (url: string, status: number): boolean =>
  status === 400 && url.includes("docs.google.com/spreadsheets/");

const fetchPublicCsv = async (url: string): Promise<Response> => {
  const response = await fetch(withCacheBuster(url), { cache: "no-store" });

  if (!response.ok && shouldRetryWithoutCacheBuster(url, response.status)) {
    return fetch(url, { cache: "no-store" });
  }

  return response;
};

// Reads public-safe CSV tabs published from Humanitarians_Public_Impact_Stats_Linked.
// The private CaseLedger tab is the source of truth in the workbook, but it is
// never fetched by the frontend.
// A future backend could replace this with an authenticated reporting API for private admin workflows.
const normalizeValue = (value: unknown): string | number => {
  if (typeof value !== "string") {
    return value as string | number;
  }

  const trimmed = value.trim();
  const cleanedNumericValue = trimmed.replace(/[₹,\s]/g, "");
  if (numericPattern.test(cleanedNumericValue)) {
    return Number(cleanedNumericValue);
  }

  return trimmed;
};

const normalizeKey = (key: string): string => key.trim().toLowerCase();

const normalizeRow = (row: Record<string, unknown>): Record<string, string | number> =>
  Object.entries(row).reduce<Record<string, string | number>>((accumulator, [rawKey, rawValue]) => {
    const key = normalizeKey(rawKey);
    if (key) {
      accumulator[key] = normalizeValue(rawValue);
    }
    return accumulator;
  }, {});

export const fetchCsv = async <T extends object>(
  url: string | undefined,
  options: FetchCsvOptions,
): Promise<T[]> => {
  if (!url || isPlaceholderUrl(url)) {
    throw new Error("CSV URL is not configured.");
  }

  const response = await fetchPublicCsv(url);
  if (!response.ok) {
    throw new Error(`Could not load public CSV (${response.status}).`);
  }

  const text = await response.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "The public CSV could not be parsed.");
  }

  const fields = (parsed.meta.fields ?? []).map(normalizeKey);
  const missingColumns = options.requiredColumns.filter((column) => !fields.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`The public sheet is missing required column(s): ${missingColumns.join(", ")}.`);
  }

  return parsed.data.map((row) => normalizeRow(row) as T);
};
