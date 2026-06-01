import type { PublicSiteSettingsRecord } from "../services/siteSettings";

const buildUpiQuery = (upiId: string, name: string, note: string): string =>
  `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&tn=${encodeURIComponent(note)}&cu=INR`;

const buildUpiAppLinks = (upiId: string, name: string, note: string) => {
  const query = buildUpiQuery(upiId, name, note);

  return [
    { label: "Google Pay", href: `tez://upi/pay?${query}` },
    { label: "PhonePe", href: `phonepe://pay?${query}` },
    { label: "Paytm", href: `paytmmp://pay?${query}` },
  ];
};

export const buildContact = (settings: PublicSiteSettingsRecord) => {
  const email = settings.contact_email;
  const newMembersGroup = settings.whatsapp_new_members_group_url;
  const sadaqahDisplayName = settings.upi_sadaqah_display_name;
  const zakatDisplayName = settings.upi_zakat_display_name;

  return {
    email,
    whatsapp: {
      newMembersGroup,
      mentorVolunteer: settings.whatsapp_mentor_volunteer_group_url,
      menteeGroup: settings.whatsapp_mentee_group_url,
    },
    links: {
      caseReferral: settings.case_referral_form_url,
      courseSponsor: newMembersGroup,
      livelihoodSponsor: newMembersGroup,
      sadaqahSupport: newMembersGroup,
    },
    qrAssets: {
      whatsappNewMembers: settings.whatsapp_new_members_qr_image,
    },
    upiPayments: [
      {
        id: "sadaqah-aqib",
        fundType: "Sadaqah",
        displayName: sadaqahDisplayName,
        purpose: `Use ${sadaqahDisplayName}'s QR for Sadaqah support.`,
        upiId: settings.upi_sadaqah_upi_id,
        upiAppLinks: buildUpiAppLinks(
          settings.upi_sadaqah_upi_id,
          sadaqahDisplayName,
          "Humanitarians Sadaqah support",
        ),
        qrImage: settings.upi_sadaqah_qr_image,
      },
      {
        id: "zakat-sahil",
        fundType: "Zakat",
        displayName: zakatDisplayName,
        purpose: `Use ${zakatDisplayName}'s QR for Zakat support.`,
        upiId: settings.upi_zakat_upi_id,
        upiAppLinks: buildUpiAppLinks(
          settings.upi_zakat_upi_id,
          zakatDisplayName,
          "Humanitarians Zakat support",
        ),
        qrImage: settings.upi_zakat_qr_image,
      },
    ],
    bank: {
      accountName: settings.bank_account_name,
      accountNumber: settings.bank_account_number,
      ifsc: settings.bank_ifsc,
      branch: settings.bank_branch,
    },
  };
};

export type ContactInfo = ReturnType<typeof buildContact>;
