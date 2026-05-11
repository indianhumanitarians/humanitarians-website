# Humanitarians Public Website

Production-ready public website for **Humanitarians**, a community-driven charity started by IIT Kanpur alumni. The site presents the livelihood-first model, donation and joining options, anonymized case stories, Zakat and Sadaqah handling, mentorship, public reporting, and privacy-safe impact stats.

Core message:

- From support to self-reliance
- Charity with dignity
- Livelihood, skills, and mentorship
- Transparent monthly reporting

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Recharts
- PapaParse
- Tailwind CSS v4

## Main Pages

Routes are defined in `src/App.tsx`.

- `/` - Home
- `/donate` - Donate / Join
- `/our-model` - Operating model
- `/case-stories` - Anonymized public case stories
- `/mentorship` - Mentorship program and testimonials
- `/reports` - Monthly public reports derived from CaseLedger
- `/zakat-sadaqah` - Zakat and Sadaqah handling
- `/about` - About and profile PDF
- `/contact` - Contact details

## Development Setup

Requirements:

- Node.js 20+ recommended
- npm
- Git

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Run the local dev server:

```bash
npm run dev
```

Vite will print a local URL, usually:

```txt
http://localhost:5173
```

Build for production:

```bash
npm run build
```

Before each production build, `npm run build` automatically runs:

```bash
npm run refresh:fallback
```

That command fetches the latest published CaseLedger and MentorshipTestimonials
CSV tabs and rewrites `src/data/fallbackSheets.ts`, so the bundled fallback
snapshot stays current for deployments. If Google Sheets is temporarily
unavailable during a build, the refresh step logs a warning and keeps the
existing committed fallback snapshot so the build can still complete.

Preview the production build:

```bash
npm run preview
```

## Environment Variables

The app has no backend. It fetches public, privacy-reviewed CSV data from Google Sheets.

Required local variables:

```txt
VITE_STATS_CASE_LEDGER_CSV_URL="..."
VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL="..."
```

Rules:

- Keep real values in `.env`.
- Commit only `.env.example`.
- If a CSV URL is missing or unavailable, the site shows a live-data-unavailable state instead of using saved public data.
- Add the same variables in Netlify or any other hosting provider.

## Public Data Source

The public Google Sheet workbook is expected to be named:

```txt
Humanitarians_Public_Impact_Stats_Linked
```

The site currently reads these published CSV tabs:

- `CaseLedger`
- `MentorshipTestimonials`

`CaseLedger` is the master public-safe table. It drives:

- Public stats
- Monthly reports
- Support-type charts
- Fund-type charts
- Case stories
- Homepage impact numbers

Publish `CaseLedger` only after privacy review, because the frontend derives public information directly from this tab.

## CaseLedger Publishing Rules

Rows are included in public stats only when:

```txt
case_id is not blank
include_in_public_stats = TRUE
```

Rows appear as public case stories only when:

```txt
case_id is not blank
published = Yes
```

Case-story images appear only when:

```txt
image_consent_status = Consent received
```

Important behavior:

- Rows without `case_id` are ignored.
- `period_sort` is preferred for sorting when present.
- If `period_sort` is missing, the app tries to parse `period_label`, for example `Jan 2026`.
- `total_amount` is used when present; otherwise the app calculates it from `amount_zakat`, `amount_sadaqah`, and `other_amount`.
- If `fund_type` is blank, the app derives it from the amount columns.
- Reports are derived live from `CaseLedger`; there are no saved public report rows in the repo.

## Mentorship Testimonials

The `MentorshipTestimonials` tab is used for public mentee testimonials.

Testimonials appear only when:

```txt
consent_received = Yes
publish_status = Publish
```

Required public-safe fields:

```txt
testimonial_id
display_order
anonymized_name
public_role
mentorship_track
mentee_stage
public_location
period_label
outcome_summary
testimonial_text
profile_image_url
profile_image_alt
carousel_tagline
consent_received
publish_status
privacy_note
```

Internal field:

```txt
editing_note
```

The website does not render `editing_note`.

If there are no publishable testimonials, the mentorship page shows a safe empty state.

## Case Images

Case images are read from public URLs in `CaseLedger`.

Use these fields:

```txt
image_url_1
image_alt_1
image_caption_1
image_url_2
image_alt_2
image_caption_2
image_url_3
image_alt_3
image_caption_3
image_consent_status
image_publish_notes
```

Rules:

- Use only public-safe images.
- Set Google Drive image sharing to `Anyone with the link can view`.
- Use clear alt text for every image.
- Do not publish images that show full names, phone numbers, addresses, IDs, payment details, bank details, UPI IDs, donor identities, or private documents.
- `image_publish_notes` is internal and is never rendered publicly.
- If no approved image is available, the site shows a placeholder.

## Privacy Rules

Never publish:

- Full recipient names
- Phone numbers
- Exact addresses
- Aadhaar, PAN, bank, UPI, payment, or document details
- Donor names
- Private notes
- Draft cases
- Draft testimonials
- Images without consent
- `editing_note`
- `image_publish_notes`

Keep public reporting aggregated and anonymized. Do not claim government registration, 80G, FCRA, tax exemption, scholar certification, or a 100% Zakat policy unless verified public copy is added later.

## Editable Website Content

Common editable content locations:

- Contact, WhatsApp, UPI, bank, QR, and CTA links: `src/data/contact.ts`
- Founder names: `src/data/founders.ts`
- General site copy and external profile URL: `src/data/site.ts`
- FAQs: `src/data/faq.ts`
- Case-story image handling: `src/components/cases/CaseImageCarousel.tsx`
- Public stats derivation: `src/services/caseLedgerStats.ts`
- CSV fetching and validation: `src/services/googleSheets.ts`

Public assets:

- Logo: `public/images/logo.jpeg`
- WhatsApp QR: `public/images/humanitarians-new-members-whatsapp-qr.jpeg`
- Zakat UPI QR: `public/images/upi-zakat-sahil-siddiqui.png`
- Sadaqah UPI QR: `public/images/upi-sadaqah-mohammad-aqib.png`

## Google Sheets Operating Precautions

Published CSV URLs depend on the Google Sheet and each tab's internal `gid`.

Best practice:

1. Keep one permanent Google Sheet named `Humanitarians_Public_Impact_Stats_Linked`.
2. Keep existing public tabs alive.
3. Update data by pasting values into existing tabs.
4. Do not delete and recreate public tabs unless necessary.
5. Do not import a full `.xlsx` over the existing published workbook unless ready to republish every tab.
6. Do not rename public tabs unless documentation and CSV URLs are updated.
7. Keep private/raw tabs separate and never publish them.

Safer update workflow:

1. Make edits in a copy or temporary sheet.
2. Review privacy-sensitive columns.
3. Copy only public-safe values.
4. Paste values into the existing public tab.
5. Keep the same tab and published CSV URL.
6. Refresh the website and verify.

If published CSV URLs break:

1. Open the Google Sheet.
2. Go to File > Share > Publish to web.
3. Republish each public tab as CSV.
4. Copy the new CSV URLs.
5. Update local `.env`.
6. Restart `npm run dev`.
7. Update hosting environment variables.
8. Trigger a redeploy if needed.

## Local-Only Files And Git Ignore

The following files and folders are intentionally ignored:

```txt
.env
.env.local
.env.*.local
Humanitarians_Public_Impact_Stats_Linked.xlsx
/anas/
/case-images/
```

Important: `.gitignore` does not remove files that were already committed. If a local-only folder is already visible on GitHub, remove it from Git tracking while keeping it locally:

```bash
git rm --cached -r anas
git commit -m "Stop tracking local anas folder"
git push
```

After this, `anas/` remains on your machine but is deleted from the remote repository on the next push.

For this repo, `anas/index.html` has already been removed from Git tracking in the current working tree. Commit and push the staged deletion to remove it from GitHub.

## Deployment On Netlify

Netlify is the recommended free deployment path for this static Vite site.

Build settings:

```txt
Build command: npm run build
Publish directory: dist
```

Add these environment variables in Netlify:

```txt
VITE_STATS_CASE_LEDGER_CSV_URL
VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL
```

After Netlify is connected to GitHub, every push to `main` triggers a deployment.
Because the build command is `npm run build`, Netlify refreshes the bundled
fallback data from the published Google Sheet tabs before compiling the site.

If only Google Sheet data changes, a redeploy is usually not needed because the site fetches published CSV data on page load with light cache busting.

## Direct Route Support

This app uses React Router. Netlify needs `public/_redirects` so direct URLs work after deployment.

Required file content:

```txt
/* /index.html 200
```

Vite copies this file into `dist/_redirects` during `npm run build`.

## Deployment Checklist

After deployment, test:

- `/`
- `/about`
- `/donate`
- `/case-stories`
- `/mentorship`
- `/reports`
- `/zakat-sadaqah`
- `/contact`

Also verify:

- Donate and Join QR images load.
- UPI buttons open correctly on supported devices.
- WhatsApp links open correctly.
- Case-story carousel images load or show placeholders.
- Profile button opens the Google Drive profile file from the About page.
- Google Sheet stats show live data or a clear unavailable state.
- Mentorship testimonials appear only after consent and publish approval.
- Direct refresh works on routes such as `/about` and `/reports`.

## Custom Domain Notes

The site can use Netlify's free subdomain or a custom domain.

Recommended setup for a custom domain:

```txt
yourdomain.org -> redirects to www.yourdomain.org
www.yourdomain.org -> primary website
```

After buying a domain, add it in Netlify under Domain management, copy the DNS records Netlify provides into the registrar, and wait for DNS and HTTPS provisioning.

## No Backend In This MVP

This MVP has no backend. A backend is only needed later for features such as admin login, private case applications, document uploads, donor records, payment reconciliation, or mentor/mentee matching dashboards.
