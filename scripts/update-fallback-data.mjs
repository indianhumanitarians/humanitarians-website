import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");
const outputPath = path.join(rootDir, "src", "data", "fallbackSheets.ts");

const env = fs.existsSync(envPath)
  ? Object.fromEntries(
      fs
        .readFileSync(envPath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const [key, ...valueParts] = line.split("=");
          const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          return [key.trim(), value];
        }),
    )
  : {};

const urls = {
  caseLedger:
    process.env.VITE_STATS_CASE_LEDGER_CSV_URL ??
    env.VITE_STATS_CASE_LEDGER_CSV_URL,
  mentorshipTestimonials:
    process.env.VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL ??
    env.VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL,
};

const isMissingUrl = (url) =>
  !url || url.includes("PASTE_PUBLIC_") || !url.startsWith("https://");

const fetchCsvRows = async (label, url) => {
  if (isMissingUrl(url)) {
    throw new Error(`${label} CSV URL is not configured.`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} CSV could not be fetched (${response.status}).`);
  }

  const csv = await response.text();
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(
      `${label} CSV could not be parsed: ${parsed.errors[0]?.message}`,
    );
  }

  return parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row)
        .map(([key, value]) => [key.trim(), typeof value === "string" ? value.trim() : value])
        .filter(([key]) => key.length > 0),
    ),
  );
};

const toNumber = (value) => {
  const numericValue = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getDataThrough = (caseRows) => {
  const latestRow = caseRows
    .filter((row) => String(row.include_in_public_stats ?? "").toLowerCase() === "true")
    .sort((a, b) => toNumber(b.period_sort) - toNumber(a.period_sort))[0];

  return String(latestRow?.period_label ?? "").trim() || "May 2026";
};

const getLastUpdated = () =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

const main = async () => {
  const [caseLedgerRows, mentorshipTestimonialRows] = await Promise.all([
    fetchCsvRows("CaseLedger", urls.caseLedger),
    fetchCsvRows("MentorshipTestimonials", urls.mentorshipTestimonials),
  ]);

  const dataThrough = getDataThrough(caseLedgerRows);
  const content = `import type { CaseLedgerRow, MentorshipTestimonial } from "../types/stats";

export const fallbackSnapshotLabel = "Snapshot data through ${dataThrough}";
export const fallbackSnapshotLastUpdated = "${getLastUpdated()}";

export const fallbackCaseLedgerRows = ${JSON.stringify(
    caseLedgerRows,
    null,
    2,
  )} as unknown as CaseLedgerRow[];

export const fallbackMentorshipTestimonialRows = ${JSON.stringify(
    mentorshipTestimonialRows,
    null,
    2,
  )} as unknown as MentorshipTestimonial[];
`;

  fs.writeFileSync(outputPath, content);
  console.log(
    `Updated fallback data: ${caseLedgerRows.length} case rows, ${mentorshipTestimonialRows.length} mentorship rows, data through ${dataThrough}.`,
  );
};

main().catch((error) => {
  console.warn(
    `Could not refresh fallback data. Keeping existing bundled snapshot. Reason: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
});
