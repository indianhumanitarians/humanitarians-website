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
  mentorshipTestimonialsUrl: env.VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL,
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

const toCaseImport = async (row) => {
  const caseNumber = text(row.case_id);
  const periodSort = toNumber(row.period_sort) || periodSortFromLabel(row.period_label);
  const payload = {
    case_number: caseNumber,
    reporting_month: periodLabelFromSort(periodSort) || text(row.period_label),
    reporting_month_sort: periodSort || null,
    reporting_month_start: text(row.month_start) || monthStartFromSort(periodSort) || null,
    support_category: text(row.category),
    support_description: text(row.support_type),
    fund_source: text(row.fund_type),
    zakat_amount: toNumber(row.amount_zakat),
    sadaqah_amount: toNumber(row.amount_sadaqah),
    other_amount: toNumber(row.other_amount),
    beneficiary_name: firstText(row, ["recipient_name", "full_name", "name"]),
    beneficiary_phone: firstText(row, ["recipient_phone", "phone", "mobile"]),
    beneficiary_private_location: firstText(row, ["recipient_location", "address", "private_location"]),
    public_story_title: firstText(row, ["public_title", "title"]),
    public_location: firstText(row, ["public_location"]),
    public_need_summary: firstText(row, ["need_public", "need"]),
    public_support_summary: firstText(row, ["support_provided_public", "support_provided"]),
    public_outcome_summary: firstText(row, ["outcome_public", "outcome"]),
    public_follow_up_summary: firstText(row, ["follow_up_public", "follow_up"]),
    show_in_public_stats: parseBoolean(row.include_in_public_stats),
    publish_public_story: parseBoolean(row.published),
  };
  const images = [];

  for (const slot of [1, 2, 3]) {
    const sourceUrl = text(row[`image_url_${slot}`]);
    if (shouldWrite && shouldImportImages && sourceUrl) {
      try {
        images.push({
          display_order: slot,
          ...(await uploadImageToSupabase(caseNumber, slot, sourceUrl)),
        });
      } catch (error) {
        console.warn(`Skipping image ${slot} for ${caseNumber}: ${error.message}`);
      }
    } else if (!shouldWrite && sourceUrl) {
      images.push({
        display_order: slot,
        storage_path: sourceUrl,
        public_url: sourceUrl,
      });
    }
  }

  return { caseNumber, payload, images };
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
  profile_image_url: text(row.profile_image_url) || null,
  carousel_tagline: text(row.carousel_tagline),
  consent_received: parseBoolean(row.consent_received),
  privacy_note: text(row.privacy_note),
  editing_note: text(row.editing_note) || null,
});

const toLookupPayloads = (values) =>
  [...new Set(values.map(text).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({
      name,
      is_active: true,
    }));

const main = async () => {
  const caseRows = await fetchCsvRows("CaseLedger", config.caseLedgerUrl);
  const caseRowsWithIds = caseRows
    .filter((row) => text(row.case_id))
    .filter(
      (row) =>
        !restoreCaseNumber ||
        text(row.case_id).toLowerCase() === restoreCaseNumber.toLowerCase(),
    );
  const testimonialRowsWithIds = restoreCaseNumber
    ? []
    : (
        await fetchCsvRows(
          "MentorshipTestimonials",
          config.mentorshipTestimonialsUrl,
        )
      ).filter((row) => text(row.testimonial_id));

  if (restoreCaseNumber && caseRowsWithIds.length === 0) {
    throw new Error(`${restoreCaseNumber} was not found in the CaseLedger CSV.`);
  }

  const imageUrlCount = caseRowsWithIds.reduce(
    (count, row) =>
      count +
      [row.image_url_1, row.image_url_2, row.image_url_3].filter((value) => text(value)).length,
    0,
  );

  console.log(
    `Fetched CaseLedger: ${caseRowsWithIds.length} importable row${caseRowsWithIds.length === 1 ? "" : "s"}`,
  );
  if (restoreCaseNumber) {
    console.log(`Single-case restore mode: ${restoreCaseNumber}`);
    console.log("MentorshipTestimonials import skipped.");
  } else {
    console.log(`Fetched MentorshipTestimonials: ${testimonialRowsWithIds.length} importable rows`);
  }
  console.log(`Found case image URLs: ${imageUrlCount}`);

  if (!shouldWrite) {
    console.log("Dry run only. Re-run with --write to upsert into Supabase.");
    return;
  }

  const caseImports = [];
  for (const row of caseRowsWithIds) {
    caseImports.push(await toCaseImport(row));
  }

  const casePayloads = caseImports.map((caseImport) => caseImport.payload);
  const testimonialPayloads = testimonialRowsWithIds.map(toTestimonialPayload);
  const categoryPayloads = toLookupPayloads(
    casePayloads.map((payload) => payload.support_category),
  );
  const fundTypePayloads = toLookupPayloads(
    casePayloads.map((payload) => payload.fund_source),
  );

  const importedCases = await supabaseRest("cases", {
    method: "POST",
    query: { on_conflict: "case_number" },
    prefer: "resolution=merge-duplicates,return=representation",
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

  const imagePayloads = caseImports.flatMap((caseImport) => {
    const importedCase = (importedCases ?? []).find(
      (item) => item.case_number === caseImport.caseNumber,
    );
    if (!importedCase) {
      return [];
    }

    return caseImport.images.map((image) => ({
      case_number: caseImport.caseNumber,
      display_order: image.display_order,
      storage_path: image.storage_path,
      public_url: image.public_url,
    }));
  });

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
