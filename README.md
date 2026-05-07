# Humanitarians Public Website

Production-ready MVP for **Humanitarians**, a community-driven Muslim charity started by IIT Kanpur alumni. The site explains the livelihood-first model, anonymized case stories, Zakat and Sadaqah handling, mentorship, donation placeholders, and public transparency reporting.

Brand focus: “From support to self-reliance.” “Charity with dignity.” “Livelihood, skills, and mentorship.” “Transparent monthly reporting.”

Tech stack: React, TypeScript, Vite, React Router, Recharts, PapaParse, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Public Google Sheet stats

This MVP has no backend. Live stats are fetched directly from public CSV URLs published from a Google Sheet workbook named:

`Humanitarians_Public_Impact_Stats`

Public-safe tabs:

- `MonthlyStats`
- `SupportTypes`
- `ImpactSummary`
- `LastUpdated`
- `Reports`
- `CaseStorySeeds`

Create a local `.env` from `.env.example` and paste each public CSV URL into the matching variable:

```bash
cp .env.example .env
```

## Publishing CSV tabs from Google Sheets

1. Upload `Humanitarians_Public_Impact_Stats.xlsx` to Google Sheets.
2. Name the Google Sheet: `Humanitarians_Public_Impact_Stats`.
3. For each public tab, go to File > Share > Publish to web.
4. Choose the specific tab.
5. Choose CSV.
6. Copy the CSV URL.
7. Paste each CSV URL into the matching `VITE_` environment variable.
8. Do not publish raw private sheets containing names, Aadhaar numbers, phone numbers, addresses, UPI IDs, donor names, or private case notes.

## Privacy checklist before publishing

- Do not show real full recipient names.
- Do not show phone numbers.
- Do not show addresses below city/state level.
- Do not show Aadhaar, PAN, bank details, UPI IDs, payment IDs, documents, medical documents, or private notes.
- Do not show donor names.
- Public stories must stay anonymized to protect recipient dignity and privacy.
- Zakat and Sadaqah must remain tracked separately in monthly reports.
- Stats must be aggregated and privacy-safe.
- Do not claim government registration, 80G, FCRA, tax exemption, scholar certification, or a 100% Zakat policy unless verified editable copy is added later.

## Deployment

Deploy as a static Vite site on Vercel, Netlify, Cloudflare Pages, or similar static hosting. Configure the same `VITE_STATS_*_CSV_URL` environment variables in the hosting dashboard.

## Editable public content

- Public WhatsApp, email, UPI, bank, and CTA links live in `src/data/contact.ts`.
- Founder names live in `src/data/founders.ts`.
- Case story image galleries live in `src/data/caseStoryMedia.ts`.
- The About page profile download path lives in `src/data/site.ts`. Replace `public/docs/humanitarians-impact-profile.pdf` with the final PDF, or update the path to a PPT/PDF you add later.

Note: This MVP has no backend. A backend is only needed later for admin login, private case applications, document uploads, donor records, payment reconciliation, or mentor/mentee matching dashboards.
