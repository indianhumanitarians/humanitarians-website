import type { AdminCase } from "../types/admin";
import type { FundTypeStat, MonthlyStat, SupportTypeStat } from "../types/stats";
import { periodSortFromLabel } from "./adminCases";

export interface AdminMonthlySummary {
  period_label: string;
  period_sort: number;
  total_cases: number;
  public_stats_cases: number;
  published_story_cases: number;
  zakat_cases: number;
  sadaqah_cases: number;
  mixed_cases: number;
  other_fund_cases: number;
  zakat_amount: number;
  sadaqah_amount: number;
  other_amount: number;
  total_amount: number;
}

export interface AdminCategorySummary {
  category: string;
  cases: number;
  total_amount: number;
  public_stats_cases: number;
  published_story_cases: number;
}

export interface AdminInsights {
  totalAmount: number;
  zakatAmount: number;
  sadaqahAmount: number;
  otherAmount: number;
  averageCaseAmount: number;
  publicStatsCases: number;
  publishedStoryCases: number;
  monthly: AdminMonthlySummary[];
  monthlyChartRows: MonthlyStat[];
  fundTypes: FundTypeStat[];
  supportTypes: SupportTypeStat[];
  categories: AdminCategorySummary[];
}

const text = (value: unknown): string => String(value ?? "").trim();

const amount = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const adminCaseTotalAmount = (item: AdminCase): number =>
  amount(item.total_amount) ||
  amount(item.zakat_amount) + amount(item.sadaqah_amount) + amount(item.other_amount);

const categoryKey = (category: string): string =>
  `category_${category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;

const normalizedFundType = (item: AdminCase): string => {
  const fundSource = text(item.fund_source);

  if (fundSource) {
    return fundSource;
  }

  const fundAmounts = [
    amount(item.zakat_amount),
    amount(item.sadaqah_amount),
    amount(item.other_amount),
  ];
  if (fundAmounts.filter((fundAmount) => fundAmount > 0).length > 1) {
    return "Mixed";
  }
  if (fundAmounts[0] > 0) {
    return "Zakat";
  }
  if (fundAmounts[1] > 0) {
    return "Sadaqah";
  }
  if (fundAmounts[2] > 0) {
    return "Other";
  }

  return "Unspecified";
};

const periodSortForCase = (item: AdminCase): number =>
  amount(item.reporting_month_sort) || periodSortFromLabel(item.reporting_month) || 0;

export const deriveAdminInsights = (cases: AdminCase[]): AdminInsights => {
  const categoryNames = Array.from(
    new Set(cases.map((item) => text(item.support_category)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const monthly = new Map<number, AdminMonthlySummary>();
  const fundTypes = new Map<string, FundTypeStat>();
  const supportTypes = new Map<string, SupportTypeStat>();
  const categories = new Map<string, AdminCategorySummary>();

  for (const item of cases) {
    const total = adminCaseTotalAmount(item);
    const periodSort = periodSortForCase(item);
    const periodLabel = text(item.reporting_month) || "Unspecified";
    const fundType = normalizedFundType(item);
    const category = text(item.support_category) || "Unspecified";
    const supportType = text(item.support_description) || "Unspecified";

    if (periodSort) {
      const existingMonthly = monthly.get(periodSort) ?? {
        period_label: periodLabel,
        period_sort: periodSort,
        total_cases: 0,
        public_stats_cases: 0,
        published_story_cases: 0,
        zakat_cases: 0,
        sadaqah_cases: 0,
        mixed_cases: 0,
        other_fund_cases: 0,
        zakat_amount: 0,
        sadaqah_amount: 0,
        other_amount: 0,
        total_amount: 0,
      };

      existingMonthly.total_cases += 1;
      existingMonthly.public_stats_cases += item.show_in_public_stats ? 1 : 0;
      existingMonthly.published_story_cases += item.publish_public_story ? 1 : 0;
      existingMonthly.zakat_cases += fundType.toLowerCase() === "zakat" ? 1 : 0;
      existingMonthly.sadaqah_cases += fundType.toLowerCase() === "sadaqah" ? 1 : 0;
      existingMonthly.mixed_cases += fundType.toLowerCase() === "mixed" ? 1 : 0;
      existingMonthly.other_fund_cases +=
        !["zakat", "sadaqah", "mixed"].includes(fundType.toLowerCase()) ? 1 : 0;
      existingMonthly.zakat_amount += amount(item.zakat_amount);
      existingMonthly.sadaqah_amount += amount(item.sadaqah_amount);
      existingMonthly.other_amount += amount(item.other_amount);
      existingMonthly.total_amount += total;
      monthly.set(periodSort, existingMonthly);
    }

    const fundKey = fundType.toLowerCase();
    const existingFundType = fundTypes.get(fundKey) ?? {
      fund_type: fundType,
      cases: 0,
      total_amount: 0,
    };
    existingFundType.cases += 1;
    existingFundType.total_amount += total;
    fundTypes.set(fundKey, existingFundType);

    const supportKey = `${category.toLowerCase()}|${supportType.toLowerCase()}`;
    const existingSupportType = supportTypes.get(supportKey) ?? {
      category,
      support_type: supportType,
      cases: 0,
      total_amount: 0,
      zakat_amount: 0,
      sadaqah_amount: 0,
      mixed_cases: 0,
      public_label: supportType,
    };
    existingSupportType.cases += 1;
    existingSupportType.total_amount += total;
    existingSupportType.zakat_amount =
      amount(existingSupportType.zakat_amount) + amount(item.zakat_amount);
    existingSupportType.sadaqah_amount =
      amount(existingSupportType.sadaqah_amount) + amount(item.sadaqah_amount);
    existingSupportType.mixed_cases =
      amount(existingSupportType.mixed_cases) +
      (fundType.toLowerCase() === "mixed" ? 1 : 0);
    supportTypes.set(supportKey, existingSupportType);

    const existingCategory = categories.get(category) ?? {
      category,
      cases: 0,
      total_amount: 0,
      public_stats_cases: 0,
      published_story_cases: 0,
    };
    existingCategory.cases += 1;
    existingCategory.total_amount += total;
    existingCategory.public_stats_cases += item.show_in_public_stats ? 1 : 0;
    existingCategory.published_story_cases += item.publish_public_story ? 1 : 0;
    categories.set(category, existingCategory);
  }

  const monthlyRows = Array.from(monthly.values()).sort(
    (a, b) => a.period_sort - b.period_sort,
  );
  const monthlyChartRows: MonthlyStat[] = monthlyRows.map((row) => {
    const monthCases = cases.filter((item) => periodSortForCase(item) === row.period_sort);

    return {
      period_label: row.period_label,
      period_sort: row.period_sort,
      total_cases: row.total_cases,
      amount_zakat: row.zakat_amount,
      amount_sadaqah: row.sadaqah_amount,
      other_funds: row.other_amount,
      total_amount: row.total_amount,
      include_in_public: "TRUE",
      source_notes: "Derived from private admin case table",
      ...Object.fromEntries(
        categoryNames.map((category) => [
          categoryKey(category),
          monthCases.filter((item) => text(item.support_category) === category).length,
        ]),
      ),
    };
  });
  const totalAmount = cases.reduce((sum, item) => sum + adminCaseTotalAmount(item), 0);

  return {
    totalAmount,
    zakatAmount: cases.reduce((sum, item) => sum + amount(item.zakat_amount), 0),
    sadaqahAmount: cases.reduce((sum, item) => sum + amount(item.sadaqah_amount), 0),
    otherAmount: cases.reduce((sum, item) => sum + amount(item.other_amount), 0),
    averageCaseAmount: cases.length > 0 ? totalAmount / cases.length : 0,
    publicStatsCases: cases.filter((item) => item.show_in_public_stats).length,
    publishedStoryCases: cases.filter((item) => item.publish_public_story).length,
    monthly: monthlyRows,
    monthlyChartRows,
    fundTypes: Array.from(fundTypes.values()).sort(
      (a, b) => b.total_amount - a.total_amount || b.cases - a.cases,
    ),
    supportTypes: Array.from(supportTypes.values()).sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        b.cases - a.cases ||
        b.total_amount - a.total_amount,
    ),
    categories: Array.from(categories.values()).sort(
      (a, b) => b.total_amount - a.total_amount || b.cases - a.cases,
    ),
  };
};
