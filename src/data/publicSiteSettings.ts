export const ACTIVE_DONOR_COMMUNITY_SETTING = "active_donor_community";

export const PUBLIC_SITE_SETTING_DEFAULTS = {
  active_donor_community: "150+",
  contact_email: "indianhumanitarians@gmail.com",
  whatsapp_new_members_group_url:
    "https://chat.whatsapp.com/ICHmOfadrBnAReSB568crd?mode=gi_t",
  whatsapp_new_members_qr_image:
    "/images/humanitarians-new-members-whatsapp-qr.jpeg",
  whatsapp_new_members_qr_storage_path: "",
  whatsapp_mentor_volunteer_group_url:
    "https://chat.whatsapp.com/IKQhWIXlQDW5azPfuRSL64?mode=gi_t",
  whatsapp_mentee_group_url:
    "https://chat.whatsapp.com/CZYDCNhhIwWARydpIK1hm7?mode=gi_t",
  about_profile_url:
    "https://drive.google.com/file/d/18NIxGJpotj_TCZmThOB1-y8djLhNwP0u/view?usp=drivesdk",
  case_referral_form_url: "https://forms.gle/j25asHA6ekoLqxEn8",
  upi_sadaqah_display_name: "Mohammad Aqib",
  upi_sadaqah_upi_id: "8957768755@jupiteraxis",
  upi_sadaqah_qr_image: "/images/upi-sadaqah-mohammad-aqib.png",
  upi_sadaqah_qr_storage_path: "",
  upi_zakat_display_name: "Shahil Siddiqui",
  upi_zakat_upi_id: "9565596161@jupiteraxis",
  upi_zakat_qr_image: "/images/upi-zakat-sahil-siddiqui.png",
  upi_zakat_qr_storage_path: "",
  bank_account_name: "Humanitarians",
  bank_account_number: "Editable placeholder",
  bank_ifsc: "Editable placeholder",
  bank_branch: "Editable placeholder",
} as const;

export type PublicSiteSettingKey = keyof typeof PUBLIC_SITE_SETTING_DEFAULTS;

export interface PublicSiteSettingDefinition {
  key: PublicSiteSettingKey;
  label: string;
  helperText: string;
  group: "Impact" | "Contact" | "Payment";
  subgroup?: "Sadaqah" | "Zakat" | "Bank";
  inputType?: "text" | "email" | "url";
}

export const PUBLIC_SITE_SETTING_DEFINITIONS: PublicSiteSettingDefinition[] = [
  {
    key: "active_donor_community",
    label: "Active donor community",
    helperText: "Shown on the homepage and reports as the donor community size.",
    group: "Impact",
  },
  {
    key: "contact_email",
    label: "Contact email",
    helperText: "Used in the footer and contact page.",
    group: "Contact",
    inputType: "email",
  },
  {
    key: "about_profile_url",
    label: "About/profile document URL",
    helperText: "The external link behind the About page profile button.",
    group: "Contact",
    inputType: "url",
  },
  {
    key: "whatsapp_mentor_volunteer_group_url",
    label: "Mentor volunteer WhatsApp URL",
    helperText: "Used by Contact and Mentorship pages for mentor volunteers.",
    group: "Contact",
    inputType: "url",
  },
  {
    key: "whatsapp_mentee_group_url",
    label: "Mentee WhatsApp URL",
    helperText: "Used by the Mentorship page for mentee requests.",
    group: "Contact",
    inputType: "url",
  },
  {
    key: "case_referral_form_url",
    label: "Case referral form URL",
    helperText: "Google Form opened by public Refer a Case buttons.",
    group: "Contact",
    inputType: "url",
  },
  {
    key: "whatsapp_new_members_group_url",
    label: "New Members WhatsApp URL",
    helperText: "Main donor/community WhatsApp group link.",
    group: "Contact",
    inputType: "url",
  },
  {
    key: "whatsapp_new_members_qr_image",
    label: "New Members WhatsApp QR",
    helperText: "QR image shown on the Donate page for the new members WhatsApp group.",
    group: "Contact",
  },
  {
    key: "upi_sadaqah_display_name",
    label: "Sadaqah UPI display name",
    helperText: "Name shown on the Sadaqah payment card.",
    group: "Payment",
    subgroup: "Sadaqah",
  },
  {
    key: "upi_sadaqah_upi_id",
    label: "Sadaqah UPI ID",
    helperText: "UPI ID and app deep-link value for Sadaqah.",
    group: "Payment",
    subgroup: "Sadaqah",
  },
  {
    key: "upi_sadaqah_qr_image",
    label: "Sadaqah QR image URL/path",
    helperText: "Public image URL or site path for the Sadaqah QR.",
    group: "Payment",
    subgroup: "Sadaqah",
  },
  {
    key: "upi_zakat_display_name",
    label: "Zakat UPI display name",
    helperText: "Name shown on the Zakat payment card.",
    group: "Payment",
    subgroup: "Zakat",
  },
  {
    key: "upi_zakat_upi_id",
    label: "Zakat UPI ID",
    helperText: "UPI ID and app deep-link value for Zakat.",
    group: "Payment",
    subgroup: "Zakat",
  },
  {
    key: "upi_zakat_qr_image",
    label: "Zakat QR image URL/path",
    helperText: "Public image URL or site path for the Zakat QR.",
    group: "Payment",
    subgroup: "Zakat",
  },
  {
    key: "bank_account_name",
    label: "Bank account name",
    helperText: "Shown in the bank transfer section.",
    group: "Payment",
    subgroup: "Bank",
  },
  {
    key: "bank_account_number",
    label: "Bank account number",
    helperText: "Shown in the bank transfer section.",
    group: "Payment",
    subgroup: "Bank",
  },
  {
    key: "bank_ifsc",
    label: "Bank IFSC",
    helperText: "Shown in the bank transfer section.",
    group: "Payment",
    subgroup: "Bank",
  },
  {
    key: "bank_branch",
    label: "Bank branch",
    helperText: "Shown in the bank transfer section.",
    group: "Payment",
    subgroup: "Bank",
  },
];

export const publicSiteSettingDefaultRows = PUBLIC_SITE_SETTING_DEFINITIONS.map(
  (definition) => ({
    setting_key: definition.key,
    setting_value: PUBLIC_SITE_SETTING_DEFAULTS[definition.key],
    label: definition.label,
    helper_text: definition.helperText,
    is_public: true,
  }),
).concat([
  {
    setting_key: "whatsapp_new_members_qr_storage_path",
    setting_value: PUBLIC_SITE_SETTING_DEFAULTS.whatsapp_new_members_qr_storage_path,
    label: "New Members WhatsApp QR storage path",
    helper_text: "Internal storage path for the uploaded new members WhatsApp QR.",
    is_public: false,
  },
  {
    setting_key: "upi_sadaqah_qr_storage_path",
    setting_value: PUBLIC_SITE_SETTING_DEFAULTS.upi_sadaqah_qr_storage_path,
    label: "Sadaqah QR storage path",
    helper_text: "Internal storage path for the uploaded Sadaqah QR.",
    is_public: false,
  },
  {
    setting_key: "upi_zakat_qr_storage_path",
    setting_value: PUBLIC_SITE_SETTING_DEFAULTS.upi_zakat_qr_storage_path,
    label: "Zakat QR storage path",
    helper_text: "Internal storage path for the uploaded Zakat QR.",
    is_public: false,
  },
]);
