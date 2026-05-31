export type DataSourceState = "live" | "partial" | "error";

export interface MonthlyStat {
  [key: string]: string | number | undefined;
  period_label: string;
  period_sort: number;
  month_start?: string;
  total_cases: number;
  amount_zakat: number;
  amount_sadaqah: number;
  other_funds: number;
  total_amount: number;
  source_notes?: string;
  include_in_public: string;
}

export interface CaseLedgerRow extends Partial<CaseStory> {
  case_number: string;
  show_in_public_stats: boolean;
  publish_public_story: boolean;
  reporting_month?: string;
  reporting_month_sort?: number;
  reporting_month_start?: string;
  support_category?: string;
  support_description?: string;
  zakat_amount?: number;
  sadaqah_amount?: number;
  other_amount?: number;
  total_amount?: number;
  fund_source?: string;
}

export interface MonthlyCategoryStat {
  key: string;
  label: string;
  valueKey: string;
}

export interface SupportTypeStat {
  category: string;
  support_type: string;
  cases: number;
  total_amount: number;
  zakat_amount?: number;
  sadaqah_amount?: number;
  mixed_cases?: number;
  public_label: string;
}

export interface FundTypeStat {
  fund_type: string;
  cases: number;
  total_amount: number;
}

export interface ImpactSummaryStat {
  metric: string;
  value: string | number;
  label: string;
  display_order: number;
  source_note?: string;
}

export interface LastUpdatedStat {
  last_updated: string;
  data_through: string;
  note: string;
  source_workbook: string;
}

export interface ReportRow {
  period_label: string;
  period_sort: number;
  zakat_cases_count: number;
  sadaqah_cases_count: number;
  mixed_cases_count: number;
  other_fund_cases_count?: number;
  livelihood_cases_count: number;
  skill_or_education_cases_count: number;
  emergency_community_cases_count: number;
  total_public_summary: string;
  download_report_url: string;
  source_notes: string;
  status: string;
  published: string;
}

export interface CaseStory {
  case_number: string;
  public_story_title: string;
  public_beneficiary_label: string;
  support_category: string;
  support_description: string;
  fund_source: string;
  reporting_month: string;
  public_location: string;
  amount_range: string;
  public_need_summary: string;
  public_support_summary: string;
  public_outcome_summary: string;
  public_follow_up_summary: string;
  publish_public_story: boolean;
  case_image_1_url?: string;
  case_image_1_alt?: string;
  case_image_2_url?: string;
  case_image_2_alt?: string;
  case_image_3_url?: string;
  case_image_3_alt?: string;
}

export interface CaseStoryImage {
  src: string;
  alt: string;
}

export interface MentorshipTestimonial {
  testimonial_id: string;
  anonymized_name: string;
  public_role: string;
  mentorship_track: string;
  mentee_stage: string;
  public_location: string;
  period_label: string;
  outcome_summary: string;
  testimonial_text: string;
  profile_image_url?: string;
  profile_image_alt?: string;
  carousel_tagline: string;
  consent_received: boolean;
  privacy_note: string;
  editing_note?: string;
}

export interface PublicStats {
  monthly: MonthlyStat[];
  supportTypes: SupportTypeStat[];
  fundTypes: FundTypeStat[];
  impactSummary: ImpactSummaryStat[];
  lastUpdated: LastUpdatedStat;
}

export interface CsvFetchResult<T> {
  rows: T[];
  error?: string;
}
