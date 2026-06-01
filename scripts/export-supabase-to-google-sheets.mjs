import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");
const rawArgs = process.argv.slice(2);

const text = (value) => String(value ?? "").trim();

const getArgValue = (name, fallback = "") => {
  const inlineMatch = rawArgs.find((arg) => arg.startsWith(`${name}=`));
  if (inlineMatch) {
    return text(inlineMatch.slice(name.length + 1));
  }

  const index = rawArgs.indexOf(name);
  if (index >= 0) {
    return text(rawArgs[index + 1]);
  }

  return fallback;
};

const readEnvFile = () => {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return Object.fromEntries(
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
  );
};

const env = {
  ...readEnvFile(),
  ...process.env,
};

const config = {
  supabaseUrl: String(env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, ""),
  serviceKey: env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY,
  outDir: path.resolve(rootDir, getArgValue("--out", ".google-sheets-export")),
};

const CASE_COLUMNS = [
  "case_number",
  "reporting_month",
  "reporting_month_sort",
  "reporting_month_start",
  "publish_public_story",
  "show_in_public_stats",
  "public_story_title",
  "public_location",
  "support_category",
  "support_description",
  "zakat_amount",
  "sadaqah_amount",
  "other_amount",
  "total_amount",
  "fund_source",
  "beneficiary_name",
  "beneficiary_phone",
  "beneficiary_private_location",
  "public_need_summary",
  "public_support_summary",
  "public_outcome_summary",
  "public_follow_up_summary",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
];

const CASE_IMAGE_COLUMNS = [
  "case_number",
  "display_order",
  "source_image_url",
  "storage_path",
  "public_url",
];

const TESTIMONIAL_COLUMNS = [
  "testimonial_id",
  "anonymized_name",
  "public_role",
  "mentorship_track",
  "mentee_stage",
  "public_location",
  "period_label",
  "outcome_summary",
  "testimonial_text",
  "profile_image_storage_path",
  "profile_image_url",
  "carousel_tagline",
  "consent_received",
  "privacy_note",
  "editing_note",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
];

const LOOKUP_COLUMNS = ["name", "display_order", "is_active"];

const monthAliases = new Map(
  [
    ["Jan", ["jan", "january"]],
    ["Feb", ["feb", "february"]],
    ["Mar", ["mar", "march"]],
    ["Apr", ["apr", "april"]],
    ["May", ["may"]],
    ["Jun", ["jun", "june"]],
    ["Jul", ["jul", "july"]],
    ["Aug", ["aug", "august"]],
    ["Sep", ["sep", "sept", "september"]],
    ["Oct", ["oct", "october"]],
    ["Nov", ["nov", "november"]],
    ["Dec", ["dec", "december"]],
  ].flatMap(([label, aliases], index) =>
    aliases.map((alias) => [alias, { label, month: index + 1 }]),
  ),
);

const normalizeKey = (key) => key.trim().toLowerCase();

const normalizeRow = (row) =>
  Object.fromEntries(
    Object.entries(row)
      .map(([key, value]) => [
        normalizeKey(key),
        typeof value === "string" ? value.trim() : value,
      ])
      .filter(([key]) => key.length > 0),
  );

const requireValue = (value, label) => {
  if (!value) {
    throw new Error(`${label} is required in .env.`);
  }
};

const parseBoolean = (value) =>
  ["true", "yes", "publish", "published", "public", "1"].includes(
    text(value).toLowerCase(),
  );

const toNumber = (value) => {
  const numericValue = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const firstText = (row, keys) => {
  for (const key of keys) {
    const value = text(row[normalizeKey(key)]);
    if (value) {
      return value;
    }
  }
  return "";
};

const periodSortFromLabel = (periodLabel) => {
  const trimmedPeriod = text(periodLabel);
  const monthInputMatch = trimmedPeriod.match(/^(\d{4})-(\d{2})$/);
  if (monthInputMatch) {
    const year = Number(monthInputMatch[1]);
    const month = Number(monthInputMatch[2]);
    return year > 1900 && month >= 1 && month <= 12 ? year * 100 + month : 0;
  }

  const [monthText, yearText] = trimmedPeriod.split(/\s+/);
  const month = monthAliases.get(monthText?.toLowerCase());
  const year = Number(yearText);

  return month && Number.isFinite(year) ? year * 100 + month.month : 0;
};

const periodLabelFromSort = (periodSort) => {
  const numericSort = toNumber(periodSort);
  const year = Math.floor(numericSort / 100);
  const month = numericSort % 100;
  const monthLabel = Array.from(monthAliases.values()).find(
    (item) => item.month === month,
  )?.label;

  return year && monthLabel ? `${monthLabel} ${year}` : "";
};

const monthStartFromSort = (periodSort) => {
  const numericSort = toNumber(periodSort);
  const year = Math.floor(numericSort / 100);
  const month = numericSort % 100;

  return year && month >= 1 && month <= 12
    ? `${year}-${String(month).padStart(2, "0")}-01`
    : "";
};

const supabaseHeaders = (extraHeaders = {}) => ({
  apikey: config.serviceKey,
  Authorization: `Bearer ${config.serviceKey}`,
  ...extraHeaders,
});

const fetchSupabaseRows = async (table, query = {}) => {
  requireValue(config.supabaseUrl, "VITE_SUPABASE_URL");
  requireValue(config.serviceKey, "SUPABASE_SERVICE_ROLE_KEY");

  const rows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const url = new URL(`${config.supabaseUrl}/rest/v1/${table}`);
    Object.entries({ select: "*", ...query }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url, {
      headers: supabaseHeaders({
        Range: `${offset}-${offset + pageSize - 1}`,
        "Range-Unit": "items",
      }),
    });

    if (!response.ok) {
      throw new Error(`${table} could not be fetched (${response.status}): ${await response.text()}`);
    }

    const pageRows = await response.json();
    rows.push(...pageRows.map(normalizeRow));

    if (pageRows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return rows;
};

const orderedRow = (columns, row) =>
  Object.fromEntries(columns.map((column) => [column, row[column] ?? ""]));

const normalizeCase = (row) => {
  const caseNumber = firstText(row, ["case_number"]);
  const periodSort =
    toNumber(firstText(row, ["reporting_month_sort"])) ||
    periodSortFromLabel(firstText(row, ["reporting_month"]));
  const reportingMonth =
    periodLabelFromSort(periodSort) ||
    firstText(row, ["reporting_month"]);
  const zakatAmount = toNumber(firstText(row, ["zakat_amount"]));
  const sadaqahAmount = toNumber(firstText(row, ["sadaqah_amount"]));
  const otherAmount = toNumber(firstText(row, ["other_amount"]));

  return orderedRow(CASE_COLUMNS, {
    case_number: caseNumber,
    reporting_month: reportingMonth,
    reporting_month_sort: periodSort || "",
    reporting_month_start:
      firstText(row, ["reporting_month_start"]) ||
      monthStartFromSort(periodSort),
    publish_public_story: parseBoolean(firstText(row, ["publish_public_story"]))
      ? "TRUE"
      : "FALSE",
    show_in_public_stats: parseBoolean(firstText(row, ["show_in_public_stats"]))
      ? "TRUE"
      : "FALSE",
    public_story_title: firstText(row, ["public_story_title"]),
    public_location: firstText(row, ["public_location"]),
    support_category: firstText(row, ["support_category"]),
    support_description: firstText(row, ["support_description"]),
    zakat_amount: zakatAmount,
    sadaqah_amount: sadaqahAmount,
    other_amount: otherAmount,
    total_amount: zakatAmount + sadaqahAmount + otherAmount,
    fund_source: firstText(row, ["fund_source"]),
    beneficiary_name: firstText(row, ["beneficiary_name"]),
    beneficiary_phone: firstText(row, ["beneficiary_phone"]),
    beneficiary_private_location: firstText(row, ["beneficiary_private_location"]),
    public_need_summary: firstText(row, ["public_need_summary"]),
    public_support_summary: firstText(row, ["public_support_summary"]),
    public_outcome_summary: firstText(row, ["public_outcome_summary"]),
    public_follow_up_summary: firstText(row, ["public_follow_up_summary"]),
    created_by: firstText(row, ["created_by"]),
    updated_by: firstText(row, ["updated_by"]),
    created_at: firstText(row, ["created_at"]),
    updated_at: firstText(row, ["updated_at"]),
  });
};

const normalizeCaseImageRecord = (row) =>
  orderedRow(CASE_IMAGE_COLUMNS, {
    case_number: firstText(row, ["case_number"]),
    display_order: firstText(row, ["display_order"]),
    source_image_url: firstText(row, ["public_url"]),
    storage_path: firstText(row, ["storage_path"]),
    public_url: firstText(row, ["public_url"]),
  });

const normalizeTestimonial = (row) =>
  orderedRow(TESTIMONIAL_COLUMNS, {
    testimonial_id: firstText(row, ["testimonial_id"]),
    anonymized_name: firstText(row, ["anonymized_name"]),
    public_role: firstText(row, ["public_role"]),
    mentorship_track: firstText(row, ["mentorship_track"]),
    mentee_stage: firstText(row, ["mentee_stage"]),
    public_location: firstText(row, ["public_location"]),
    period_label: firstText(row, ["period_label"]),
    outcome_summary: firstText(row, ["outcome_summary"]),
    testimonial_text: firstText(row, ["testimonial_text"]),
    profile_image_storage_path: firstText(row, ["profile_image_storage_path"]),
    profile_image_url: firstText(row, ["profile_image_url"]),
    carousel_tagline: firstText(row, ["carousel_tagline"]),
    consent_received: parseBoolean(firstText(row, ["consent_received"]))
      ? "TRUE"
      : "FALSE",
    privacy_note: firstText(row, ["privacy_note"]),
    editing_note: firstText(row, ["editing_note"]),
    created_by: firstText(row, ["created_by"]),
    updated_by: firstText(row, ["updated_by"]),
    created_at: firstText(row, ["created_at"]),
    updated_at: firstText(row, ["updated_at"]),
  });

const normalizeLookupRecord = (row) =>
  orderedRow(LOOKUP_COLUMNS, {
    name: firstText(row, ["name"]),
    display_order: firstText(row, ["display_order"]),
    is_active: parseBoolean(firstText(row, ["is_active"])) ? "TRUE" : "FALSE",
  });

const fetchSupabaseExportData = async () => {
  const [caseRows, caseImageRows, testimonialRows, supportCategoryRows, fundTypeRows] =
    await Promise.all([
      fetchSupabaseRows("cases", { order: "case_number.asc" }),
      fetchSupabaseRows("case_images", { order: "case_number.asc,display_order.asc" }),
      fetchSupabaseRows("mentorship_testimonials", { order: "testimonial_id.asc" }),
      fetchSupabaseRows("support_categories", { order: "display_order.asc,name.asc" }),
      fetchSupabaseRows("fund_types", { order: "display_order.asc,name.asc" }),
    ]);

  return {
    sourceLabel: "Supabase private tables",
    normalizedCases: caseRows.map(normalizeCase).filter((row) => text(row.case_number)),
    normalizedCaseImages: caseImageRows
      .map(normalizeCaseImageRecord)
      .filter((row) => text(row.case_number)),
    normalizedTestimonials: testimonialRows
      .map(normalizeTestimonial)
      .filter((row) => text(row.testimonial_id)),
    supportCategories: supportCategoryRows
      .map(normalizeLookupRecord)
      .filter((row) => text(row.name)),
    fundTypes: fundTypeRows
      .map(normalizeLookupRecord)
      .filter((row) => text(row.name)),
  };
};

const writeCsv = (fileName, rows, columns) => {
  const filePath = path.join(config.outDir, fileName);
  const csv = Papa.unparse(rows.length > 0 ? rows : [orderedRow(columns, {})], {
    columns,
  });
  fs.writeFileSync(filePath, `${csv}\n`);
  return filePath;
};

const writeReadme = (files, sourceLabel) => {
  const content = `# Humanitarians Google Sheets Import

Generated from ${sourceLabel}.

These CSV files use the latest project column standards. They are intended for a new Google Sheet backup/workbook, not for direct public website runtime.

## Import order

1. Create a blank Google Sheet.
2. Import each CSV below using File > Import > Upload.
3. For the first CSV, choose "Replace spreadsheet".
4. For every later CSV, choose "Insert new sheet(s)".
5. Rename each imported tab to the suggested tab name.

## Files

${files.map((file) => `- ${path.basename(file.path)} -> tab name: ${file.tab}`).join("\n")}

## Privacy warning

The case ledger CSV can include private beneficiary names, phone numbers, and addresses. Do not publish this sheet publicly and do not commit this export folder to GitHub.
`;

  fs.writeFileSync(path.join(config.outDir, "README.md"), content);
};

const main = async () => {
  fs.mkdirSync(config.outDir, { recursive: true });

  const {
    sourceLabel,
    normalizedCases,
    normalizedCaseImages,
    normalizedTestimonials,
    supportCategories,
    fundTypes,
  } = await fetchSupabaseExportData();

  const files = [
    {
      path: writeCsv("case-ledger-latest.csv", normalizedCases, CASE_COLUMNS),
      tab: "Case Ledger",
    },
    {
      path: writeCsv("case-images-latest.csv", normalizedCaseImages, CASE_IMAGE_COLUMNS),
      tab: "Case Images",
    },
    {
      path: writeCsv(
        "mentorship-testimonials-latest.csv",
        normalizedTestimonials,
        TESTIMONIAL_COLUMNS,
      ),
      tab: "Mentorship Testimonials",
    },
    {
      path: writeCsv("support-categories-latest.csv", supportCategories, LOOKUP_COLUMNS),
      tab: "Support Categories",
    },
    {
      path: writeCsv("fund-types-latest.csv", fundTypes, LOOKUP_COLUMNS),
      tab: "Fund Types",
    },
  ];

  writeReadme(files, sourceLabel);

  console.log(`Created Google Sheets CSV export from ${sourceLabel} in ${path.relative(rootDir, config.outDir)}`);
  console.log(`Case rows: ${normalizedCases.length}`);
  console.log(`Case image rows: ${normalizedCaseImages.length}`);
  console.log(`Mentorship testimonial rows: ${normalizedTestimonials.length}`);
  console.log("Import these CSVs into a blank Google Sheet as separate tabs.");
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
