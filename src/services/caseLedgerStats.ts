import type {
  CaseLedgerRow,
  CaseStory,
  FundTypeStat,
  ImpactSummaryStat,
  LastUpdatedStat,
  MonthlyStat,
  PublicStats,
  ReportRow,
  SupportTypeStat,
} from "../types/stats";

const MONTHS = new Map(
  [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ].map((month, index) => [month, index + 1]),
);

const ACTIVE_DONOR_COMMUNITY = "150+";

export const caseLedgerColumns = [
  "case_id",
  "include_in_public_stats",
  "published",
  "publish_status",
  "period_label",
  "category",
  "support_type",
  "amount_zakat",
  "amount_sadaqah",
  "other_amount",
  "fund_type",
];

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const numericValue = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const text = (value: unknown): string => String(value ?? "").trim();

const matches = (value: unknown, expected: string): boolean =>
  text(value).toLowerCase() === expected.toLowerCase();

const isPresent = (value: unknown): boolean => text(value).length > 0;

const parsePeriodSort = (row: CaseLedgerRow): number => {
  const existingSort = toNumber(row.period_sort);
  if (existingSort > 0) {
    return existingSort;
  }

  const periodLabel = text(row.period_label);
  const [monthText, yearText] = periodLabel.split(/\s+/);
  const month = MONTHS.get(monthText?.slice(0, 3).toLowerCase() ?? "");
  const year = Number(yearText);

  if (month && Number.isFinite(year)) {
    return year * 100 + month;
  }

  return 0;
};

const periodLabelFromSort = (periodSort: number): string => {
  const year = Math.floor(periodSort / 100);
  const month = periodSort % 100;
  const monthLabel = Array.from(MONTHS.entries()).find(([, value]) => value === month)?.[0];

  if (!year || !monthLabel) {
    return "";
  }

  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} ${year}`;
};

const monthStartFromSort = (periodSort: number): string => {
  const year = Math.floor(periodSort / 100);
  const month = periodSort % 100;

  if (!year || month < 1 || month > 12) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
};

const totalAmount = (row: CaseLedgerRow): number => {
  const explicitTotal = toNumber(row.total_amount);
  if (explicitTotal > 0) {
    return explicitTotal;
  }

  return (
    toNumber(row.amount_zakat) +
    toNumber(row.amount_sadaqah) +
    toNumber(row.other_amount)
  );
};

const normalizedFundType = (row: CaseLedgerRow): string => {
  const fundType = text(row.fund_type);
  if (fundType) {
    return fundType;
  }

  const amounts = [
    toNumber(row.amount_zakat),
    toNumber(row.amount_sadaqah),
    toNumber(row.other_amount),
  ];
  if (amounts.filter((amount) => amount > 0).length > 1) {
    return "Mixed";
  }
  if (amounts[0] > 0) {
    return "Zakat";
  }
  if (amounts[1] > 0) {
    return "Sadaqah";
  }
  if (amounts[2] > 0) {
    return "Other";
  }
  return "";
};

const categoryKey = (category: string): string =>
  `category_${category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;

const amountRangeFromTotal = (amount: number): string => {
  if (amount <= 0) {
    return "";
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
  return "More than ₹1,00,000";
};

const isPublicStatsRow = (row: CaseLedgerRow): boolean =>
  isPresent(row.case_id) && matches(row.include_in_public_stats, "TRUE");

const isPublishableStory = (row: CaseLedgerRow): boolean =>
  isPresent(row.case_id) && matches(row.published, "Yes");

const isSkillOrEducation = (category: string): boolean =>
  ["skill sponsorship", "education support", "course sponsorship"].includes(
    category.toLowerCase(),
  );

const isEmergencyOrCommunity = (category: string): boolean =>
  ["emergency support", "community support"].includes(category.toLowerCase());

const isOtherFund = (fundType: string): boolean => {
  const normalized = fundType.toLowerCase();
  return (
    normalized.length > 0 &&
    !["zakat", "sadaqah", "mixed"].includes(normalized)
  );
};

const sortPublicRows = (rows: CaseLedgerRow[]): CaseLedgerRow[] =>
  rows
    .filter(isPublicStatsRow)
    .sort((a, b) => parsePeriodSort(a) - parsePeriodSort(b));

const deriveMonthly = (rows: CaseLedgerRow[]): MonthlyStat[] => {
  const monthly = new Map<number, MonthlyStat>();
  const categories = Array.from(
    new Set(rows.filter(isPublicStatsRow).map((row) => text(row.category)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  for (const row of sortPublicRows(rows)) {
    const periodSort = parsePeriodSort(row);
    if (!periodSort) {
      continue;
    }

    const existing = monthly.get(periodSort) ?? {
      period_label: text(row.period_label) || periodLabelFromSort(periodSort),
      period_sort: periodSort,
      month_start: text(row.month_start) || monthStartFromSort(periodSort),
      total_cases: 0,
      amount_zakat: 0,
      amount_sadaqah: 0,
      other_funds: 0,
      total_amount: 0,
      source_notes: "Derived from CaseLedger",
      include_in_public: "TRUE",
      ...Object.fromEntries(categories.map((category) => [categoryKey(category), 0])),
    };

    const category = text(row.category);
    existing.total_cases += 1;
    existing.amount_zakat += toNumber(row.amount_zakat);
    existing.amount_sadaqah += toNumber(row.amount_sadaqah);
    existing.other_funds += toNumber(row.other_amount);
    existing.total_amount += totalAmount(row);
    if (category) {
      const key = categoryKey(category);
      existing[key] = toNumber(existing[key]) + 1;
    }

    monthly.set(periodSort, existing);
  }

  return Array.from(monthly.values()).sort((a, b) => a.period_sort - b.period_sort);
};

const deriveSupportTypes = (rows: CaseLedgerRow[]): SupportTypeStat[] => {
  const supportTypes = new Map<string, SupportTypeStat>();

  for (const row of rows.filter(isPublicStatsRow)) {
    const category = text(row.category);
    const supportType = text(row.support_type);
    if (!category || !supportType) {
      continue;
    }

    const key = `${category.toLowerCase()}|${supportType.toLowerCase()}`;
    const existing = supportTypes.get(key) ?? {
      category,
      support_type: supportType,
      cases: 0,
      total_amount: 0,
      zakat_amount: 0,
      sadaqah_amount: 0,
      mixed_cases: 0,
      public_label: supportType,
    };

    existing.cases += 1;
    existing.total_amount += totalAmount(row);
    existing.zakat_amount = toNumber(existing.zakat_amount) + toNumber(row.amount_zakat);
    existing.sadaqah_amount = toNumber(existing.sadaqah_amount) + toNumber(row.amount_sadaqah);
    existing.mixed_cases =
      toNumber(existing.mixed_cases) + (matches(normalizedFundType(row), "Mixed") ? 1 : 0);

    supportTypes.set(key, existing);
  }

  return Array.from(supportTypes.values()).sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      b.cases - a.cases ||
      a.support_type.localeCompare(b.support_type),
  );
};

const deriveFundTypes = (rows: CaseLedgerRow[]): FundTypeStat[] => {
  const fundTypes = new Map<string, FundTypeStat>();

  for (const row of rows.filter(isPublicStatsRow)) {
    const fundType = normalizedFundType(row);
    if (!fundType) {
      continue;
    }

    const key = fundType.toLowerCase();
    const existing = fundTypes.get(key) ?? {
      fund_type: fundType,
      cases: 0,
      total_amount: 0,
    };

    existing.cases += 1;
    existing.total_amount += totalAmount(row);
    fundTypes.set(key, existing);
  }

  return Array.from(fundTypes.values()).sort(
    (a, b) => b.cases - a.cases || a.fund_type.localeCompare(b.fund_type),
  );
};

const metric = (
  metricName: string,
  value: string | number,
  label: string,
  displayOrder: number,
  sourceNote = "Derived from CaseLedger.",
): ImpactSummaryStat => ({
  metric: metricName,
  value,
  label,
  display_order: displayOrder,
  source_note: sourceNote,
});

const deriveImpactSummary = (
  rows: CaseLedgerRow[],
  monthly: MonthlyStat[],
  supportTypes: SupportTypeStat[],
): ImpactSummaryStat[] => {
  const publicRows = rows.filter(isPublicStatsRow);
  const totalAmountDisbursed = monthly.reduce((sum, row) => sum + row.total_amount, 0);
  const latestMonth = monthly[monthly.length - 1];
  const topSupportTypes = [...supportTypes]
    .sort((a, b) => b.cases - a.cases || b.total_amount - a.total_amount)
    .slice(0, 5);

  return [
    metric("active_donor_community", ACTIVE_DONOR_COMMUNITY, "Active WhatsApp donor community", 1, "Configured in website code."),
    metric("total_public_cases", publicRows.length, "Anonymized public cases tracked", 2),
    metric("total_amount_disbursed", totalAmountDisbursed, "Total support amount in public-safe summary", 3),
    metric("livelihood_cases", publicRows.filter((row) => matches(row.category, "Livelihood")).length, "Livelihood generation cases", 4),
    metric("skill_education_cases", publicRows.filter((row) => isSkillOrEducation(text(row.category))).length, "Skill / education / course cases", 5),
    metric("emergency_community_cases", publicRows.filter((row) => isEmergencyOrCommunity(text(row.category))).length, "Emergency and community cases", 6),
    metric("zakat_only_cases", publicRows.filter((row) => matches(normalizedFundType(row), "Zakat")).length, "Zakat-only cases", 7),
    metric("sadaqah_only_cases", publicRows.filter((row) => matches(normalizedFundType(row), "Sadaqah")).length, "Sadaqah-only cases", 8),
    metric("mixed_fund_cases", publicRows.filter((row) => matches(normalizedFundType(row), "Mixed")).length, "Mixed fund cases", 9),
    metric("zakat_amount_disbursed", monthly.reduce((sum, row) => sum + row.amount_zakat, 0), "Zakat amount allocated", 10),
    metric("sadaqah_amount_disbursed", monthly.reduce((sum, row) => sum + row.amount_sadaqah, 0), "Sadaqah amount allocated", 11),
    ...topSupportTypes.map((row, index) =>
      metric(
        `top_support_type_${index + 1}`,
        row.cases,
        `${row.support_type} cases`,
        12 + index,
        "Top support types by public case count from CaseLedger.",
      ),
    ),
    metric("published_case_stories", rows.filter(isPublishableStory).length, "Case stories approved for website publishing", 17),
    metric("data_through", latestMonth?.period_label ?? "", "Latest confirmed public stats period", 20),
  ].sort((a, b) => a.display_order - b.display_order);
};

const deriveLastUpdated = (monthly: MonthlyStat[]): LastUpdatedStat => {
  const latestMonth = monthly[monthly.length - 1];

  return {
    last_updated: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    data_through: latestMonth?.period_label ?? "",
    note: "Derived live from CaseLedger.",
    source_workbook: "CaseLedger",
  };
};

export const derivePublicStatsFromLedger = (rows: CaseLedgerRow[]): PublicStats => {
  const monthly = deriveMonthly(rows);
  const supportTypes = deriveSupportTypes(rows);
  const fundTypes = deriveFundTypes(rows);
  const impactSummary = deriveImpactSummary(rows, monthly, supportTypes);

  return {
    monthly,
    supportTypes,
    fundTypes,
    impactSummary,
    lastUpdated: deriveLastUpdated(monthly),
  };
};

export const deriveReportsFromLedger = (rows: CaseLedgerRow[]): ReportRow[] =>
  deriveMonthly(rows)
    .filter((row) => row.total_cases > 0)
    .map((row) => {
      const monthRows = rows.filter(
        (ledgerRow) =>
          isPublicStatsRow(ledgerRow) && parsePeriodSort(ledgerRow) === row.period_sort,
      );

      return {
        period_label: row.period_label,
        period_sort: row.period_sort,
        zakat_cases_count: monthRows.filter((ledgerRow) => matches(normalizedFundType(ledgerRow), "Zakat")).length,
        sadaqah_cases_count: monthRows.filter((ledgerRow) => matches(normalizedFundType(ledgerRow), "Sadaqah")).length,
        mixed_cases_count: monthRows.filter((ledgerRow) => matches(normalizedFundType(ledgerRow), "Mixed")).length,
        other_fund_cases_count: monthRows.filter((ledgerRow) => isOtherFund(normalizedFundType(ledgerRow))).length,
        livelihood_cases_count: monthRows.filter((ledgerRow) => matches(ledgerRow.category, "Livelihood")).length,
        skill_or_education_cases_count: monthRows.filter((ledgerRow) => isSkillOrEducation(text(ledgerRow.category))).length,
        emergency_community_cases_count: monthRows.filter((ledgerRow) => isEmergencyOrCommunity(text(ledgerRow.category))).length,
        total_public_summary: `₹${Math.round(row.total_amount).toLocaleString("en-IN")} public summary; ${row.total_cases} cases`,
        download_report_url: "#",
        source_notes: "Derived from CaseLedger",
        status: "Derived",
        published: "TRUE",
      };
    })
    .sort((a, b) => a.period_sort - b.period_sort);

export const deriveCaseStoriesFromLedger = (rows: CaseLedgerRow[]): CaseStory[] =>
  rows
    .filter(isPublishableStory)
    .sort((a, b) => parsePeriodSort(b) - parsePeriodSort(a))
    .map((row) => ({
      case_id: text(row.case_id),
      title: text(row.title),
      anonymized_name: text(row.anonymized_name),
      category: text(row.category),
      support_type: text(row.support_type),
      fund_type: normalizedFundType(row),
      period_label: text(row.period_label),
      public_location: text(row.public_location),
      amount_range: amountRangeFromTotal(totalAmount(row)) || text(row.amount_range),
      need: text(row.need),
      support_provided: text(row.support_provided),
      outcome: text(row.outcome),
      follow_up: text(row.follow_up),
      quote_placeholder: text(row.quote_placeholder),
      verified_quote: text(row.verified_quote),
      privacy_note: text(row.privacy_note),
      published: text(row.published),
      publish_status: text(row.publish_status),
      image_url_1: text(row.image_url_1),
      image_alt_1: text(row.image_alt_1),
      image_caption_1: text(row.image_caption_1),
      image_url_2: text(row.image_url_2),
      image_alt_2: text(row.image_alt_2),
      image_caption_2: text(row.image_caption_2),
      image_url_3: text(row.image_url_3),
      image_alt_3: text(row.image_alt_3),
      image_caption_3: text(row.image_caption_3),
      image_consent_status: text(row.image_consent_status),
      image_publish_notes: text(row.image_publish_notes),
    }));
