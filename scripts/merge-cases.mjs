import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldWrite = args.has("--write");
const shouldRenumber = !args.has("--no-renumber");
const allowImageDrop = args.has("--allow-image-drop");
const shouldDeleteSourceStorage = !args.has("--keep-source-storage");
const CASE_NUMBER_PATTERN = /^HUM-(\d+)$/i;

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

const amountFieldAliases = new Map([
  ["zakat", "zakat_amount"],
  ["zakat_amount", "zakat_amount"],
  ["sadaqah", "sadaqah_amount"],
  ["sadaqah_amount", "sadaqah_amount"],
  ["other", "other_amount"],
  ["other_amount", "other_amount"],
]);

const amountFields = ["zakat_amount", "sadaqah_amount", "other_amount"];

const normalizeAmountField = (value) => {
  const normalized = text(value).toLowerCase().replace(/-/g, "_");
  return amountFieldAliases.get(normalized) ?? normalized;
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
  targetCase: getArgValue("--target", "HUM-059").toUpperCase(),
  sourceCase: getArgValue("--source", "HUM-061").toUpperCase(),
  fundType: getArgValue("--fund-type", ""),
  amountField: normalizeAmountField(getArgValue("--amount-field", "")),
};

const requireValue = (value, label) => {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
};

const toNumber = (value) => {
  const numericValue = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const totalAmount = (row) => {
  const explicitTotal = toNumber(row.total_amount);
  if (explicitTotal > 0) {
    return explicitTotal;
  }

  return (
    toNumber(row.zakat_amount) +
    toNumber(row.sadaqah_amount) +
    toNumber(row.other_amount)
  );
};

const firstPresent = (...values) => {
  const found = values.find((value) => text(value));
  return found === undefined ? null : found;
};

const boolOr = (...values) => values.some((value) => value === true);

const fundTypeToAmountField = (fundType) => {
  const normalized = text(fundType).toLowerCase();
  if (normalized.includes("zakat")) {
    return "zakat_amount";
  }
  if (normalized.includes("sadaqah") || normalized.includes("sadqa")) {
    return "sadaqah_amount";
  }
  return "other_amount";
};

const resolveAmountPlan = (targetCase, sourceCase) => {
  if (config.amountField && !amountFields.includes(config.amountField)) {
    throw new Error(
      `--amount-field must be one of: ${amountFields.join(", ")}.`,
    );
  }

  const forcedFundType = text(config.fundType);
  const forcedAmountField =
    config.amountField || (forcedFundType ? fundTypeToAmountField(forcedFundType) : "");

  if (forcedAmountField) {
    return {
      mode: "single-field",
      fundSource: forcedFundType || firstPresent(targetCase.fund_source, sourceCase.fund_source) || "",
      values: Object.fromEntries(
        amountFields.map((field) => [
          field,
          field === forcedAmountField ? totalAmount(targetCase) + totalAmount(sourceCase) : 0,
        ]),
      ),
    };
  }

  return {
    mode: "preserve-fields",
    fundSource: firstPresent(targetCase.fund_source, sourceCase.fund_source) || "",
    values: {
      zakat_amount: toNumber(targetCase.zakat_amount) + toNumber(sourceCase.zakat_amount),
      sadaqah_amount:
        toNumber(targetCase.sadaqah_amount) + toNumber(sourceCase.sadaqah_amount),
      other_amount: toNumber(targetCase.other_amount) + toNumber(sourceCase.other_amount),
    },
  };
};

const encodeStoragePath = (storagePath) =>
  storagePath.split("/").map(encodeURIComponent).join("/");

const caseNumberSequence = (caseNumber) => {
  const sequence = Number(text(caseNumber).match(CASE_NUMBER_PATTERN)?.[1]);
  return Number.isFinite(sequence) && sequence > 0 ? sequence : null;
};

const formatCaseNumber = (sequence) => `HUM-${String(sequence).padStart(3, "0")}`;

const supabaseHeaders = (extraHeaders = {}) => ({
  apikey: config.serviceKey,
  Authorization: `Bearer ${config.serviceKey}`,
  ...extraHeaders,
});

const assertConfig = () => {
  requireValue(config.supabaseUrl, "VITE_SUPABASE_URL");
  requireValue(config.serviceKey, "SUPABASE_SERVICE_ROLE_KEY");
  if (config.targetCase === config.sourceCase) {
    throw new Error("--target and --source must be different case numbers.");
  }
  if (config.amountField && !amountFields.includes(config.amountField)) {
    throw new Error(`--amount-field must be one of: ${amountFields.join(", ")}.`);
  }
};

const supabaseRest = async (table, options = {}) => {
  assertConfig();

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

const fetchCase = async (caseNumber) => {
  const rows = await supabaseRest("cases", {
    query: {
      select: "*",
      case_number: `eq.${caseNumber}`,
      limit: 1,
    },
  });

  return rows?.[0] ?? null;
};

const fetchCaseImages = async (caseNumber) =>
  (await supabaseRest("case_images", {
    query: {
      select: "*",
      case_number: `eq.${caseNumber}`,
      order: "display_order.asc",
    },
  })) ?? [];

const fetchHumCaseNumbers = async () =>
  (
    (await supabaseRest("cases", {
      query: {
        select: "case_number",
        case_number: "like.HUM-%",
      },
    })) ?? []
  ).map((row) => text(row.case_number));

const buildRenumberPlan = async (sourceCaseNumber) => {
  if (!shouldRenumber) {
    return [];
  }

  const targetSequence = caseNumberSequence(config.targetCase);
  const sourceSequence = caseNumberSequence(sourceCaseNumber);
  if (sourceSequence === null) {
    throw new Error(
      `Cannot renumber later cases because ${sourceCaseNumber} is not a HUM-### case number.`,
    );
  }
  if (targetSequence !== null && sourceSequence < targetSequence) {
    throw new Error(
      `Renumbering assumes --source is the later duplicate. Use --no-renumber or swap --target/--source for ${config.targetCase} and ${sourceCaseNumber}.`,
    );
  }

  return (await fetchHumCaseNumbers())
    .map((caseNumber) => ({
      oldCase: caseNumber,
      sequence: caseNumberSequence(caseNumber),
    }))
    .filter(({ sequence }) => sequence !== null && sequence > sourceSequence)
    .sort((left, right) => left.sequence - right.sequence)
    .map(({ oldCase, sequence }) => ({
      oldCase,
      newCase: formatCaseNumber(sequence - 1),
    }))
    .filter(({ oldCase, newCase }) => oldCase !== newCase);
};

const publicCaseImageUrl = (storagePath) =>
  `${config.supabaseUrl}/storage/v1/object/public/case-images/${encodeStoragePath(storagePath)}`;

const safeCaseNumber = (caseNumber) =>
  caseNumber.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

const safePathLabel = (value) =>
  text(value).toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "moved";

const fileNameFromStoragePath = (storagePath) =>
  text(storagePath).split("/").pop()?.replace(/[^a-zA-Z0-9._-]+/g, "-") ||
  "merged-image";

const copyCaseImageObject = async (
  sourceImage,
  targetCase,
  targetSlot,
  label = `merged-from-${safeCaseNumber(sourceImage.case_number)}`,
) => {
  const sourcePath = text(sourceImage.storage_path);
  if (!sourcePath) {
    throw new Error(
      `${sourceImage.case_number} image ${sourceImage.display_order} has no storage_path.`,
    );
  }

  const sourceResponse = await fetch(
    `${config.supabaseUrl}/storage/v1/object/case-images/${encodeStoragePath(sourcePath)}`,
    { headers: supabaseHeaders() },
  );

  if (!sourceResponse.ok) {
    throw new Error(
      `Could not fetch ${sourcePath} from storage (${sourceResponse.status}): ${await sourceResponse.text()}`,
    );
  }

  const contentType =
    sourceResponse.headers.get("content-type") || "application/octet-stream";
  const body = await sourceResponse.arrayBuffer();
  const nextPath = `cases/${safeCaseNumber(targetCase)}/${safePathLabel(
    label,
  )}-slot-${targetSlot}-${Date.now()}-${fileNameFromStoragePath(sourcePath)}`;

  const uploadResponse = await fetch(
    `${config.supabaseUrl}/storage/v1/object/case-images/${encodeStoragePath(nextPath)}`,
    {
      method: "PUT",
      headers: supabaseHeaders({
        "Content-Type": contentType,
        "x-upsert": "true",
      }),
      body,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error(
      `Could not upload ${nextPath} (${uploadResponse.status}): ${await uploadResponse.text()}`,
    );
  }

  return {
    case_number: targetCase,
    display_order: targetSlot,
    storage_path: nextPath,
    public_url: publicCaseImageUrl(nextPath),
  };
};

const renumberCaseWithStorage = async ({ oldCase, newCase }) => {
  const images = await fetchCaseImages(oldCase);
  const movedImages = [];

  for (const image of images) {
    movedImages.push({
      original: image,
      moved: await copyCaseImageObject(
        image,
        newCase,
        Number(image.display_order),
        `renumbered-from-${safeCaseNumber(oldCase)}`,
      ),
    });
  }

  await supabaseRest("cases", {
    method: "PATCH",
    query: {
      case_number: `eq.${oldCase}`,
    },
    body: {
      case_number: newCase,
    },
    prefer: "return=minimal",
  });

  for (const { moved } of movedImages) {
    await supabaseRest("case_images", {
      method: "PATCH",
      query: {
        case_number: `eq.${newCase}`,
        display_order: `eq.${moved.display_order}`,
      },
      body: {
        storage_path: moved.storage_path,
        public_url: moved.public_url,
      },
      prefer: "return=minimal",
    });
  }

  await deleteCaseStorageFolder(
    oldCase,
    movedImages.map(({ original }) => original.storage_path),
  );
};

const deleteStorageObject = async (storagePath) => {
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/case-images/${encodeStoragePath(storagePath)}`,
    {
      method: "DELETE",
      headers: supabaseHeaders(),
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Could not delete ${storagePath} from storage (${response.status}): ${await response.text()}`,
    );
  }
};

const listStoragePrefix = async (prefix) => {
  const cleanedPrefix = text(prefix).replace(/^\/+|\/+$/g, "");
  if (!cleanedPrefix) {
    return [];
  }

  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/list/case-images`,
    {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        prefix: cleanedPrefix,
        limit: 1000,
        offset: 0,
      }),
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }

    throw new Error(
      `Could not list ${cleanedPrefix} in storage (${response.status}): ${await response.text()}`,
    );
  }

  const items = await response.json();
  return items
    .map((item) => text(item.name))
    .filter(Boolean)
    .map((name) =>
      name.startsWith(`${cleanedPrefix}/`) ? name : `${cleanedPrefix}/${name}`,
    );
};

const deleteCaseStorageFolder = async (caseNumber, extraPaths = []) => {
  const folderPaths = await listStoragePrefix(`cases/${safeCaseNumber(caseNumber)}`);
  const uniquePaths = [...new Set([...extraPaths, ...folderPaths].map(text).filter(Boolean))];

  for (const storagePath of uniquePaths) {
    await deleteStorageObject(storagePath);
  }
};

const buildMergedCasePayload = (targetCase, sourceCase) => {
  const amountPlan = resolveAmountPlan(targetCase, sourceCase);

  return {
    payload: {
    reporting_month: firstPresent(targetCase.reporting_month, sourceCase.reporting_month),
    reporting_month_sort:
      toNumber(targetCase.reporting_month_sort) ||
      toNumber(sourceCase.reporting_month_sort) ||
      null,
    reporting_month_start: firstPresent(
      targetCase.reporting_month_start,
      sourceCase.reporting_month_start,
    ),
    support_category:
      firstPresent(targetCase.support_category, sourceCase.support_category) || "",
    support_description: firstPresent(
      targetCase.support_description,
      sourceCase.support_description,
    ) || "",
    fund_source: amountPlan.fundSource,
    ...amountPlan.values,
    beneficiary_name: firstPresent(targetCase.beneficiary_name, sourceCase.beneficiary_name),
    beneficiary_phone: firstPresent(targetCase.beneficiary_phone, sourceCase.beneficiary_phone),
    beneficiary_private_location: firstPresent(
      targetCase.beneficiary_private_location,
      sourceCase.beneficiary_private_location,
    ),
    public_story_title: firstPresent(
      targetCase.public_story_title,
      sourceCase.public_story_title,
    ),
    public_location: firstPresent(targetCase.public_location, sourceCase.public_location),
    public_need_summary: firstPresent(
      targetCase.public_need_summary,
      sourceCase.public_need_summary,
    ),
    public_support_summary: firstPresent(
      targetCase.public_support_summary,
      sourceCase.public_support_summary,
    ),
    public_outcome_summary: firstPresent(
      targetCase.public_outcome_summary,
      sourceCase.public_outcome_summary,
    ),
    public_follow_up_summary: firstPresent(
      targetCase.public_follow_up_summary,
      sourceCase.public_follow_up_summary,
    ),
    show_in_public_stats: boolOr(
      targetCase.show_in_public_stats,
      sourceCase.show_in_public_stats,
    ),
    publish_public_story: boolOr(
      targetCase.publish_public_story,
      sourceCase.publish_public_story,
    ),
    },
    amountPlan,
  };
};

const buildImageMergePlan = (targetImages, sourceImages) => {
  const usedSlots = new Set(targetImages.map((image) => Number(image.display_order)));
  const availableSlots = [1, 2, 3].filter((slot) => !usedSlots.has(slot));
  const sourceImagesToCopy = [];
  const sourceImagesSkipped = [];

  sourceImages.forEach((image, index) => {
    const targetSlot = availableSlots[index];
    if (targetSlot) {
      sourceImagesToCopy.push({ sourceImage: image, targetSlot });
    } else {
      sourceImagesSkipped.push(image);
    }
  });

  return { sourceImagesToCopy, sourceImagesSkipped };
};

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const saveBackup = (backup) => {
  const backupDir = path.join(rootDir, ".merge-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    backupDir,
    `case-merge-${config.targetCase}-${config.sourceCase}-${timestamp}.json`,
  );
  fs.writeFileSync(backupPath, `${JSON.stringify(backup, null, 2)}\n`);
  return backupPath;
};

const printPlan = ({
  targetCase,
  sourceCase,
  targetImages,
  sourceImages,
  mergedPayload,
  amountPlan,
  imagePlan,
  renumberPlan,
}) => {
  console.log(`Merge plan: ${config.sourceCase} -> ${config.targetCase}`);
  console.log("");
  console.log("Amounts:");
  console.log(
    `- ${config.targetCase}: ${formatAmount(totalAmount(targetCase))} (${text(
      targetCase.fund_source,
    ) || "No fund type"})`,
  );
  console.log(
    `- ${config.sourceCase}: ${formatAmount(totalAmount(sourceCase))} (${text(
      sourceCase.fund_source,
    ) || "No fund type"})`,
  );
  console.log(`- Merge mode: ${amountPlan.mode}`);
  console.log(`- Merged fund type: ${mergedPayload.fund_source || "No fund type"}`);
  amountFields.forEach((field) => {
    console.log(`- Merged ${field}: ${formatAmount(mergedPayload[field])}`);
  });
  console.log("");
  console.log("Public flags:");
  console.log(`- Include in public stats: ${mergedPayload.show_in_public_stats}`);
  console.log(`- Publish public story: ${mergedPayload.publish_public_story}`);
  console.log("");
  console.log("Images:");
  console.log(`- ${config.targetCase} currently has ${targetImages.length} image row(s).`);
  console.log(`- ${config.sourceCase} currently has ${sourceImages.length} image row(s).`);
  imagePlan.sourceImagesToCopy.forEach(({ sourceImage, targetSlot }) => {
    console.log(
      `- Copy ${config.sourceCase} image ${sourceImage.display_order} into ${config.targetCase} slot ${targetSlot}`,
    );
  });
  imagePlan.sourceImagesSkipped.forEach((sourceImage) => {
    console.log(
      `- SKIP ${config.sourceCase} image ${sourceImage.display_order}: no empty ${config.targetCase} image slot`,
    );
  });
  console.log("");
  console.log(`${config.sourceCase} case row will be deleted after ${config.targetCase} is updated.`);
  if (shouldDeleteSourceStorage) {
    console.log(`${config.sourceCase} storage folder objects will also be deleted.`);
  }

  console.log("");
  if (renumberPlan.length > 0) {
    console.log("Renumbering after the merge:");
    renumberPlan.forEach(({ oldCase, newCase }) => {
      console.log(`- ${oldCase} -> ${newCase}`);
    });
    console.log("Matching case image storage paths will be moved to the new case folders.");
  } else if (shouldRenumber) {
    console.log("Renumbering: no later HUM cases need to move.");
  } else {
    console.log("Renumbering is disabled by --no-renumber.");
  }
};

const main = async () => {
  assertConfig();

  const [targetCase, sourceCase, targetImages, sourceImages] = await Promise.all([
    fetchCase(config.targetCase),
    fetchCase(config.sourceCase),
    fetchCaseImages(config.targetCase),
    fetchCaseImages(config.sourceCase),
  ]);

  if (!targetCase) {
    throw new Error(`${config.targetCase} was not found in Supabase.`);
  }

  if (!sourceCase) {
    throw new Error(`${config.sourceCase} was not found in Supabase.`);
  }

  const { payload: mergedPayload, amountPlan } = buildMergedCasePayload(
    targetCase,
    sourceCase,
  );
  const imagePlan = buildImageMergePlan(targetImages, sourceImages);
  const renumberPlan = await buildRenumberPlan(config.sourceCase);

  printPlan({
    targetCase,
    sourceCase,
    targetImages,
    sourceImages,
    mergedPayload,
    amountPlan,
    imagePlan,
    renumberPlan,
  });

  if (imagePlan.sourceImagesSkipped.length > 0 && !allowImageDrop) {
    console.log("");
    console.log(
      "Dry run stopped: source images would be skipped. Remove/replace images manually, or re-run with --allow-image-drop if you accept losing those image rows.",
    );
    if (shouldWrite) {
      process.exit(1);
    }
  }

  if (!shouldWrite) {
    console.log("");
    console.log("Dry run only. Re-run with --write to apply this merge.");
    return;
  }

  const backupPath = saveBackup({
    targetCase,
    sourceCase,
    targetImages,
    sourceImages,
    mergedPayload,
    amountPlan,
    imagePlan,
    renumberPlan,
  });
  console.log("");
  console.log(`Backup saved: ${backupPath}`);

  const copiedImages = [];
  for (const item of imagePlan.sourceImagesToCopy) {
    copiedImages.push(
      await copyCaseImageObject(item.sourceImage, config.targetCase, item.targetSlot),
    );
  }

  await supabaseRest("cases", {
    method: "PATCH",
    query: {
      case_number: `eq.${config.targetCase}`,
    },
    body: mergedPayload,
    prefer: "return=minimal",
  });

  if (copiedImages.length > 0) {
    await supabaseRest("case_images", {
      method: "POST",
      query: { on_conflict: "case_number,display_order" },
      body: copiedImages,
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }

  await supabaseRest("cases", {
    method: "DELETE",
    query: {
      case_number: `eq.${config.sourceCase}`,
    },
    prefer: "return=minimal",
  });

  if (shouldDeleteSourceStorage) {
    await deleteCaseStorageFolder(
      config.sourceCase,
      sourceImages.map((image) => image.storage_path),
    );
  }

  for (const item of renumberPlan) {
    console.log(`Renumbering ${item.oldCase} -> ${item.newCase}...`);
    await renumberCaseWithStorage(item);
  }

  console.log("");
  console.log(`Merge complete: ${config.sourceCase} was merged into ${config.targetCase}.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
