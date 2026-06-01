import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldWrite = args.has("--write");
const shouldImportImages = !args.has("--skip-images");

const getArgValue = (name) => {
  const inlineMatch = rawArgs.find((arg) => arg.startsWith(`${name}=`));
  if (inlineMatch) {
    return inlineMatch.slice(name.length + 1).trim();
  }

  const index = rawArgs.indexOf(name);
  if (index >= 0) {
    return text(rawArgs[index + 1]);
  }

  return "";
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
  caseLedgerUrl: env.VITE_STATS_CASE_LEDGER_CSV_URL,
  caseImagesUrl: env.VITE_STATS_CASE_IMAGES_CSV_URL,
  mentorshipTestimonialsUrl: env.VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL,
  supportCategoriesUrl: env.VITE_STATS_SUPPORT_CATEGORIES_CSV_URL,
  fundTypesUrl: env.VITE_STATS_FUND_TYPES_CSV_URL,
};

const requireValue = (value, label) => {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
};

const parseBoolean = (value) =>
  ["true", "yes", "publish", "published", "1"].includes(
    String(value ?? "").trim().toLowerCase(),
  );

const text = (value) => String(value ?? "").trim();

const restoreCaseNumber = getArgValue("--case");

const firstText = (row, keys) => {
  for (const key of keys) {
    const value = text(row[key]);
    if (value) {
      return value;
    }
  }
  return null;
};

const toNumber = (value) => {
  const numericValue = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

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

const normalizeKey = (key) => key.trim().toLowerCase();

const normalizeRow = (row) =>
  Object.fromEntries(
    Object.entries(row)
      .map(([key, value]) => [normalizeKey(key), typeof value === "string" ? value.trim() : value])
      .filter(([key]) => key.length > 0),
  );

const fetchCsvRows = async (label, url) => {
  requireValue(url, `${label} CSV URL`);

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
    throw new Error(`${label} CSV could not be parsed: ${parsed.errors[0]?.message}`);
  }

  return parsed.data.map(normalizeRow);
};

const normalizeDriveUrl = (url) => {
  const trimmedUrl = text(url);
  const fileMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  const idMatch = trimmedUrl.match(/[?&]id=([^&]+)/);
  const fileId = fileMatch?.[1] ?? idMatch?.[1];

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;
  }

  return trimmedUrl;
};

const sanitizeFileName = (fileName) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "case-image";

const encodeStoragePath = (storagePath) =>
  storagePath.split("/").map(encodeURIComponent).join("/");

const extensionFromContentType = (contentType) => {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
};

const supabaseHeaders = (extraHeaders = {}) => ({
  apikey: config.serviceKey,
  Authorization: `Bearer ${config.serviceKey}`,
  ...extraHeaders,
});

const supabaseRest = async (table, options = {}) => {
  requireValue(config.supabaseUrl, "VITE_SUPABASE_URL");
  requireValue(config.serviceKey, "SUPABASE_SERVICE_ROLE_KEY");

  const url = new URL(`${config.supabaseUrl}/rest/v1/${table}`);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: supabaseHeaders({
      "Content-Type": "application/json",
      Prefer: options.prefer ?? "return=minimal",
    }),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(`${table} request failed (${response.status}): ${await response.text()}`);
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : undefined;
};

const uploadImageToSupabase = async (caseCode, slot, sourceUrl) => {
  const normalizedUrl = normalizeDriveUrl(sourceUrl);
  if (!normalizedUrl) {
    return "";
  }

  const imageResponse = await fetch(normalizedUrl);
  if (!imageResponse.ok) {
    throw new Error(`Image fetch failed (${imageResponse.status}) for ${caseCode} image ${slot}`);
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await imageResponse.arrayBuffer();
  const safeCaseCode = caseCode.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const sourceName = sanitizeFileName(new URL(normalizedUrl).pathname.split("/").pop() || "");
  const extension = sourceName.includes(".")
    ? sourceName.split(".").pop()
    : extensionFromContentType(contentType);
  const storagePath = `cases/${safeCaseCode}/image-${slot}-${Date.now()}.${extension}`;

  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/case-images/${encodeStoragePath(storagePath)}`,
    {
      method: "PUT",
      headers: supabaseHeaders({
        "Content-Type": contentType,
        "x-upsert": "true",
      }),
      body: arrayBuffer,
    },
  );

  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status}) for ${caseCode} image ${slot}: ${await response.text()}`);
  }

  return {
    storage_path: storagePath,
    public_url: `${config.supabaseUrl}/storage/v1/object/public/case-images/${encodeStoragePath(storagePath)}`,
  };
};

const caseNumberFromRow = (row) =>
  firstText(row, ["case_number"]);

const toCaseImport = (row) => {
  const caseNumber = caseNumberFromRow(row);
  const periodSort =
    toNumber(firstText(row, ["reporting_month_sort"])) ||
    periodSortFromLabel(firstText(row, ["reporting_month"]));
  const payload = {
    case_number: caseNumber,
    reporting_month:
      periodLabelFromSort(periodSort) ||
      firstText(row, ["reporting_month"]),
    reporting_month_sort: periodSort || null,
    reporting_month_start:
      firstText(row, ["reporting_month_start"]) ||
      monthStartFromSort(periodSort) ||
      null,
    support_category: firstText(row, ["support_category"]) ?? "",
    support_description: firstText(row, ["support_description"]) ?? "",
    fund_source: firstText(row, ["fund_source"]) ?? "",
    zakat_amount: toNumber(firstText(row, ["zakat_amount"])),
    sadaqah_amount: toNumber(firstText(row, ["sadaqah_amount"])),
    other_amount: toNumber(firstText(row, ["other_amount"])),
    beneficiary_name: firstText(row, ["beneficiary_name"]),
    beneficiary_phone: firstText(row, ["beneficiary_phone"]),
    beneficiary_private_location: firstText(row, ["beneficiary_private_location"]),
    public_story_title: firstText(row, ["public_story_title"]),
    public_location: firstText(row, ["public_location"]),
    public_need_summary: firstText(row, ["public_need_summary"]),
    public_support_summary: firstText(row, ["public_support_summary"]),
    public_outcome_summary: firstText(row, ["public_outcome_summary"]),
    public_follow_up_summary: firstText(row, ["public_follow_up_summary"]),
    show_in_public_stats: parseBoolean(firstText(row, ["show_in_public_stats"])),
    publish_public_story: parseBoolean(firstText(row, ["publish_public_story"])),
  };

  return { caseNumber, payload };
};

const toCaseImageImport = async (row) => {
  const caseNumber = caseNumberFromRow(row);
  const displayOrder = toNumber(firstText(row, ["display_order"]));
  const sourceUrl = firstText(row, [
    "source_image_url",
    "public_url",
  ]);
  const existingStoragePath = firstText(row, ["storage_path"]);
  const existingPublicUrl = firstText(row, ["public_url"]);

  if (!caseNumber || !displayOrder) {
    return null;
  }

  if (
    config.supabaseUrl &&
    existingStoragePath &&
    existingPublicUrl &&
    existingPublicUrl.startsWith(config.supabaseUrl)
  ) {
    return {
      caseNumber,
      image: {
        display_order: displayOrder,
        storage_path: existingStoragePath,
        public_url: existingPublicUrl,
      },
    };
  }

  if (shouldWrite && shouldImportImages && sourceUrl) {
    try {
      return {
        caseNumber,
        image: {
          display_order: displayOrder,
          ...(await uploadImageToSupabase(caseNumber, displayOrder, sourceUrl)),
        },
      };
    } catch (error) {
      console.warn(`Skipping image ${displayOrder} for ${caseNumber}: ${error.message}`);
      return null;
    }
  }

  if (sourceUrl || existingStoragePath || existingPublicUrl) {
    return {
      caseNumber,
      image: {
        display_order: displayOrder,
        storage_path: existingStoragePath || sourceUrl || existingPublicUrl,
        public_url: existingPublicUrl || sourceUrl || existingStoragePath,
      },
    };
  }

  return null;
};

const toTestimonialPayload = (row) => ({
  testimonial_id: text(row.testimonial_id),
  anonymized_name: text(row.anonymized_name),
  public_role: text(row.public_role),
  mentorship_track: text(row.mentorship_track),
  mentee_stage: text(row.mentee_stage),
  public_location: text(row.public_location),
  period_label: text(row.period_label),
  outcome_summary: text(row.outcome_summary),
  testimonial_text: text(row.testimonial_text),
  profile_image_storage_path: text(row.profile_image_storage_path) || null,
  profile_image_url: text(row.profile_image_url) || null,
  carousel_tagline: text(row.carousel_tagline),
  consent_received: parseBoolean(row.consent_received),
  privacy_note: text(row.privacy_note),
  editing_note: text(row.editing_note) || null,
});

const toLookupPayloadsFromRows = (rows) =>
  rows
    .map((row, index) => ({
      name: firstText(row, ["name"]),
      display_order: toNumber(row.display_order) || (index + 1) * 10,
      is_active: row.is_active === undefined ? true : parseBoolean(row.is_active),
    }))
    .filter((row) => text(row.name));

const main = async () => {
  const caseRows = await fetchCsvRows("Case Ledger", config.caseLedgerUrl);
  const caseRowsWithIds = caseRows
    .filter((row) => text(caseNumberFromRow(row)))
    .filter(
      (row) =>
        !restoreCaseNumber ||
        text(caseNumberFromRow(row)).toLowerCase() === restoreCaseNumber.toLowerCase(),
    );
  const caseImageRows = shouldImportImages
    ? (await fetchCsvRows("Case Images", config.caseImagesUrl)).filter(
        (row) =>
          !restoreCaseNumber ||
          text(caseNumberFromRow(row)).toLowerCase() === restoreCaseNumber.toLowerCase(),
      )
    : [];
  const testimonialRowsWithIds = restoreCaseNumber
    ? []
    : (
        await fetchCsvRows(
          "Mentorship Testimonials",
          config.mentorshipTestimonialsUrl,
        )
      ).filter((row) => text(row.testimonial_id));
  const categoryPayloads = toLookupPayloadsFromRows(
    await fetchCsvRows("Support Categories", config.supportCategoriesUrl),
  );
  const fundTypePayloads = toLookupPayloadsFromRows(
    await fetchCsvRows("Fund Types", config.fundTypesUrl),
  );

  if (restoreCaseNumber && caseRowsWithIds.length === 0) {
    throw new Error(`${restoreCaseNumber} was not found in the Case Ledger CSV.`);
  }

  const imageUrlCount = caseImageRows.length;

  console.log(
    `Fetched Case Ledger: ${caseRowsWithIds.length} importable row${caseRowsWithIds.length === 1 ? "" : "s"}`,
  );
  if (restoreCaseNumber) {
    console.log(`Single-case restore mode: ${restoreCaseNumber}`);
    console.log("Mentorship Testimonials import skipped.");
  } else {
    console.log(`Fetched Mentorship Testimonials: ${testimonialRowsWithIds.length} importable rows`);
  }
  console.log(`Fetched Case Images: ${imageUrlCount} importable row${imageUrlCount === 1 ? "" : "s"}`);
  console.log(`Fetched Support Categories: ${categoryPayloads.length} importable rows`);
  console.log(`Fetched Fund Types: ${fundTypePayloads.length} importable rows`);

  if (!shouldWrite) {
    console.log("Dry run only. Re-run with --write to upsert into Supabase.");
    return;
  }

  const caseImports = [];
  for (const row of caseRowsWithIds) {
    caseImports.push(toCaseImport(row));
  }
  const separateCaseImageImports = [];
  for (const row of caseImageRows) {
    const imageImport = await toCaseImageImport(row);
    if (imageImport) {
      separateCaseImageImports.push(imageImport);
    }
  }

  const casePayloads = caseImports.map((caseImport) => caseImport.payload);
  const testimonialPayloads = testimonialRowsWithIds.map(toTestimonialPayload);

  await supabaseRest("cases", {
    method: "POST",
    query: { on_conflict: "case_number" },
    prefer: "resolution=merge-duplicates,return=minimal",
    body: casePayloads,
  });

  if (categoryPayloads.length > 0) {
    await supabaseRest("support_categories", {
      method: "POST",
      query: { on_conflict: "name" },
      prefer: "resolution=merge-duplicates,return=minimal",
      body: categoryPayloads,
    });
  }

  if (fundTypePayloads.length > 0) {
    await supabaseRest("fund_types", {
      method: "POST",
      query: { on_conflict: "name" },
      prefer: "resolution=merge-duplicates,return=minimal",
      body: fundTypePayloads,
    });
  }

  const imagePayloads = separateCaseImageImports.map((imageImport) => ({
    case_number: imageImport.caseNumber,
    display_order: imageImport.image.display_order,
    storage_path: imageImport.image.storage_path,
    public_url: imageImport.image.public_url,
  }));

  if (imagePayloads.length > 0) {
    await supabaseRest("case_images", {
      method: "POST",
      query: { on_conflict: "case_number,display_order" },
      prefer: "resolution=merge-duplicates,return=minimal",
      body: imagePayloads,
    });
  }

  if (testimonialPayloads.length > 0) {
    await supabaseRest("mentorship_testimonials", {
      method: "POST",
      query: { on_conflict: "testimonial_id" },
      prefer: "resolution=merge-duplicates,return=minimal",
      body: testimonialPayloads,
    });
  }

  console.log(
    restoreCaseNumber
      ? `Supabase restore complete for ${restoreCaseNumber}.`
      : "Supabase import complete.",
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
