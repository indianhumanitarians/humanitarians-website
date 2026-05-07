const email = "indianhumanitarians@gmail.com";
const newMembersGroup = "https://chat.whatsapp.com/ICHmOfadrBnAReSB568crd?mode=gi_t";

export const contact = {
  email,
  whatsapp: {
    newMembersGroup,
    mentorVolunteer:
      "https://chat.whatsapp.com/IKQhWIXlQDW5azPfuRSL64?mode=gi_t",
    menteeGroup:
      "https://chat.whatsapp.com/CZYDCNhhIwWARydpIK1hm7?mode=gi_t",
  },
  links: {
    caseReferral: `mailto:${email}?subject=${encodeURIComponent("Case referral for Humanitarians")}`,
    courseSponsor: newMembersGroup,
    livelihoodSponsor: newMembersGroup,
    sadaqahSupport: newMembersGroup,
  },
  qrAssets: {
    whatsappNewMembers: "/images/humanitarians-new-members-whatsapp-qr.jpeg",
  },
  upiPayments: [
    {
      id: "sadaqah-aqib",
      fundType: "Sadaqah",
      displayName: "Mohammad Aqib",
      purpose: "Use Aqib's QR for Sadaqah support.",
      upiId: "PASTE_AQIB_SADAQAH_UPI_ID_HERE",
      qrImage: "/images/upi-sadaqah-mohammad-aqib.png",
    },
    {
      id: "zakat-sahil",
      fundType: "Zakat",
      displayName: "Sahil Siddiqui",
      purpose: "Use Sahil's QR for Zakat support.",
      upiId: "PASTE_SAHIL_ZAKAT_UPI_ID_HERE",
      qrImage: "/images/upi-zakat-sahil-siddiqui.png",
    },
  ],
  bank: {
    accountName: "Humanitarians",
    accountNumber: "Editable placeholder",
    ifsc: "Editable placeholder",
    branch: "Editable placeholder",
  },
};
