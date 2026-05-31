export interface AdminProfile {
  user_id: string;
  email: string;
  role: "owner" | "admin" | "viewer";
  created_at?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface AdminCase {
  case_number: string;
  reporting_month: string;
  reporting_month_sort?: number | null;
  reporting_month_start?: string | null;
  support_category: string;
  support_description: string;
  fund_source: string;
  zakat_amount: number;
  sadaqah_amount: number;
  other_amount: number;
  total_amount?: number;
  beneficiary_name?: string | null;
  beneficiary_phone?: string | null;
  beneficiary_private_location?: string | null;
  public_story_title?: string | null;
  public_beneficiary_label?: string | null;
  public_location?: string | null;
  public_need_summary?: string | null;
  public_support_summary?: string | null;
  public_outcome_summary?: string | null;
  public_follow_up_summary?: string | null;
  show_in_public_stats: boolean;
  publish_public_story: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseImageUpload {
  display_order: 1 | 2 | 3;
  storage_path: string;
  public_url: string;
}

export interface TestimonialImageUpload {
  storage_path: string;
  public_url: string;
}

export interface CaseLookupOption {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CaseFormInput {
  case_number: string;
  reporting_month: string;
  support_category: string;
  support_description: string;
  fund_source: string;
  zakat_amount: string;
  sadaqah_amount: string;
  other_amount: string;
  beneficiary_name: string;
  beneficiary_phone: string;
  beneficiary_private_location: string;
  public_story_title: string;
  public_beneficiary_label: string;
  public_location: string;
  public_need_summary: string;
  public_support_summary: string;
  public_outcome_summary: string;
  public_follow_up_summary: string;
  show_in_public_stats: boolean;
  publish_public_story: boolean;
}

export interface AdminMentorshipTestimonial {
  testimonial_id: string;
  anonymized_name: string;
  public_role: string;
  mentorship_track: string;
  mentee_stage: string;
  public_location: string;
  period_label: string;
  outcome_summary: string;
  testimonial_text: string;
  profile_image_storage_path?: string | null;
  profile_image_url?: string | null;
  carousel_tagline: string;
  consent_received: boolean;
  privacy_note: string;
  editing_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestimonialFormInput {
  testimonial_id: string;
  anonymized_name: string;
  public_role: string;
  mentorship_track: string;
  mentee_stage: string;
  public_location: string;
  period_label: string;
  outcome_summary: string;
  testimonial_text: string;
  carousel_tagline: string;
  consent_received: boolean;
  privacy_note: string;
  editing_note: string;
}
