const email = "indianhumanitarians@gmail.com";
const newMembersGroup = "https://chat.whatsapp.com/ICHmOfadrBnAReSB568crd?mode=gi_t";
const buildUpiLink = (upiId: string, name: string, note: string): string =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&tn=${encodeURIComponent(note)}&cu=INR`;

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
      upiId: "8957768755@jupiteraxis",
      upiLink: buildUpiLink("8957768755@jupiteraxis", "Mohammad Aqib", "Humanitarians Sadaqah support"),
      qrImage: "/images/upi-sadaqah-mohammad-aqib.png",
    },
    {
      id: "zakat-sahil",
      fundType: "Zakat",
      displayName: "Sahil Siddiqui",
      purpose: "Use Sahil's QR for Zakat support.",
      upiId: "9565596161@jupiteraxis",
      upiLink: buildUpiLink("9565596161@jupiteraxis", "Sahil Siddiqui", "Humanitarians Zakat support"),
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
