export type DataSourceState = "live" | "partial" | "fallback";

export interface MonthlyStat {
  period_label: string;
  period_sort: number;
  month_start?: string;
  total_cases: number;
  zakat_cases?: number;
  sadaqah_cases?: number;
  mixed_cases?: number;
  livelihood_cases: number;
  skill_cases: number;
  emergency_cases: number;
  community_cases: number;
  amount_zakat: number;
  amount_sadaqah: number;
  amount_mixed?: number;
  total_amount: number;
  donations_general?: number;
  donations_zakat?: number;
  closing_balance_general?: number;
  source_notes?: string;
  include_in_public: string;
}

export interface SupportTypeStat {
  support_type: string;
  cases: number;
  total_amount: number;
  zakat_amount?: number;
  sadaqah_amount?: number;
  mixed_cases?: number;
  public_label: string;
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
  livelihood_cases_count: number;
  skill_or_education_cases_count: number;
  emergency_community_cases_count: number;
  total_public_summary: string;
  download_report_url: string;
  source_notes: string;
  status: string;
}

export interface CaseStory {
  case_id: string;
  title: string;
  anonymized_name: string;
  category: string;
  support_type: string;
  fund_type: string;
  period_label: string;
  public_location: string;
  amount_range: string;
  need: string;
  support_provided: string;
  outcome: string;
  follow_up: string;
  quote_placeholder?: string;
  verified_quote?: string;
  privacy_note: string;
  story_candidate: string;
  publish_status: string;
  image_url_1?: string;
  image_alt_1?: string;
  image_caption_1?: string;
  image_url_2?: string;
  image_alt_2?: string;
  image_caption_2?: string;
  image_url_3?: string;
  image_alt_3?: string;
  image_caption_3?: string;
  image_consent_status?: string;
  image_publish_notes?: string;
}

export interface CaseStoryImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface MentorshipTestimonial {
  testimonial_id: string;
  display_order: number;
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
  consent_received: string;
  publish_status: string;
  privacy_note: string;
  editing_note?: string;
}

export interface PublicStats {
  monthly: MonthlyStat[];
  supportTypes: SupportTypeStat[];
  impactSummary: ImpactSummaryStat[];
  lastUpdated: LastUpdatedStat;
}

export interface CsvFetchResult<T> {
  rows: T[];
  error?: string;
}
