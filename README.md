# Humanitarians Public Website

Production-ready MVP for **Humanitarians**, a community-driven charity started by IIT Kanpur alumni. The site explains the livelihood-first model, anonymized case stories, Zakat and Sadaqah handling, mentorship, donation placeholders, and public transparency reporting.

Brand focus: “From support to self-reliance.” “Charity with dignity.” “Livelihood, skills, and mentorship.” “Transparent monthly reporting.”

Tech stack: React, TypeScript, Vite, React Router, Recharts, PapaParse, and Tailwind CSS.

## Development setup

Requirements:

- Node.js 20+ recommended
- npm
- Git
- A GitHub account for deployment workflow

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

The local development server will print a URL such as:

```txt
http://localhost:5173
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Environment variables

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Paste the public Google Sheet CSV URLs into `.env`:

```txt
VITE_STATS_MONTHLY_CSV_URL="..."
VITE_STATS_SUPPORT_TYPES_CSV_URL="..."
VITE_STATS_IMPACT_SUMMARY_CSV_URL="..."
VITE_STATS_LAST_UPDATED_CSV_URL="..."
VITE_STATS_REPORTS_CSV_URL="..."
VITE_STATS_CASE_STORIES_CSV_URL="..."
VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL="..."
```

Do not commit `.env`. Only `.env.example` should be committed.

If CSV URLs are missing or a Google Sheet is temporarily unavailable, the website shows a live-data-unavailable message instead of saved public data.

## Public Google Sheet stats

This MVP has no backend. Live stats are fetched directly from public CSV URLs published from a Google Sheet workbook named:

`Humanitarians_Public_Impact_Stats_Linked`

The workbook source-of-truth tab is:

- `CaseLedger`

Do not publish or fetch `CaseLedger` directly in the frontend. It may contain private or review-stage data. The website should fetch only the public CSV tabs listed below.

Public-safe tabs:

- `MonthlyStats`
- `SupportTypes`
- `ImpactSummary`
- `LastUpdated`
- `Reports`
- `CaseStorySeeds`
- `MentorshipTestimonials`

## Publishing CSV tabs from Google Sheets

1. Upload `Humanitarians_Public_Impact_Stats_v3_Linked.xlsx` to Google Sheets.
2. Rename the Google Sheet: `Humanitarians_Public_Impact_Stats_Linked`.
3. Add new cases only in the `CaseLedger` tab.
4. Do not edit formula-driven website tabs directly.
5. Publish these public tabs as CSV:
   - `MonthlyStats`
   - `SupportTypes`
   - `ImpactSummary`
   - `LastUpdated`
   - `Reports`
   - `CaseStorySeeds`
   - `MentorshipTestimonials`
6. Paste the CSV URLs into the matching `VITE_` environment variables.
7. Do not publish `CaseLedger` directly unless it is fully privacy reviewed.
8. For case stories, set `published = Yes` before a case appears publicly.
9. For images, set `image_consent_status = Consent received` before images appear publicly.
10. Google Drive images must be shared as “Anyone with the link can view”.

Formula-generated blank rows in public tabs are ignored by the frontend. For example, rows without `period_label` are ignored in `MonthlyStats` and `Reports`, rows without `case_id` are ignored in `CaseStorySeeds`, and rows without `testimonial_id` are ignored in `MentorshipTestimonials`.

For the new mentorship testimonials tab:

1. Publish `MentorshipTestimonials` as CSV.
2. Paste the CSV URL into `VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL`.
3. Testimonials appear only when `consent_received` is `Yes` and `publish_status` is `Publish`.
4. Do not put full names, phone numbers, private notes, or internal review comments in public testimonial fields.

For case-story images:

1. Paste public image URLs into `image_url_1`, `image_url_2`, and `image_url_3` in `CaseStorySeeds`.
2. Use `image_alt_1`, `image_alt_2`, and `image_alt_3` for accessible alt text.
3. Use `image_caption_1`, `image_caption_2`, and `image_caption_3` for optional public captions.
4. Set `image_consent_status` to `Consent received` before images are shown.
5. `image_publish_notes` is internal and is not rendered publicly.
6. Google Drive images must be shared as “Anyone with the link can view” before they appear on the website.

## Google Sheets operating precautions

The public CSV URLs depend on the published Google Sheet and the internal `gid` of each tab. Be careful when changing the workbook.

Best practice:

1. Keep one permanent Google Sheet named `Humanitarians_Public_Impact_Stats_Linked`.
2. Keep the existing public tabs alive.
3. Update data by pasting values into existing tabs.
4. Do not delete and recreate public tabs unless absolutely necessary.
5. Do not import a full `.xlsx` over the existing published workbook unless you are ready to republish every tab.
6. Do not rename public tabs unless you also update documentation and verify the published CSV URL.
7. Keep private/raw tabs separate and never publish them.

Safer update workflow:

1. Make edits in a copy or temporary sheet.
2. Review privacy-sensitive columns.
3. Copy only public-safe values.
4. Paste values into the existing public tab.
5. Keep the same tab and same published CSV URL.
6. Refresh the website and verify.

If published CSV URLs break:

1. Open the Google Sheet.
2. Go to File > Share > Publish to web.
3. Republish each public tab as CSV.
4. Copy every new CSV URL.
5. Update local `.env`.
6. Restart `npm run dev`.
7. Update Netlify environment variables.
8. Trigger a redeploy.

## Case image onboarding

Use this process to add public case-story images to the website.

### 1. Prepare images

- Use only public-safe images.
- Rename files clearly, for example:

```txt
CS-001-image-1.jpg
CS-001-image-2.jpg
CS-001-image-3.jpg
```

- Avoid images that reveal faces, full names, phone numbers, addresses, documents, IDs, bank details, UPI IDs, donor names, or private surroundings.
- Prefer images of tools, sewing machines, shop stock, course material, equipment, or other support items.

### 2. Upload images to Google Drive

1. Open Google Drive.
2. Create a folder such as:

```txt
Humanitarians Public Case Images
```

3. Upload the case images.
4. Right-click each image.
5. Click **Share**.
6. Set access to:

```txt
Anyone with the link can view
```

7. Copy the image link.

Google Drive images must be shared as “Anyone with the link can view” before they appear on the website.

### 3. Add image URLs to `CaseStorySeeds`

For the matching case row, fill:

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
```

Example:

```txt
image_url_1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
image_alt_1: Sewing machine arranged for anonymized tailoring livelihood case
image_caption_1: Sewing machine support for home-based tailoring
image_consent_status: Consent received
```

Images are shown only when:

```txt
image_consent_status = Consent received
```

Case stories are shown only when:

```txt
case_id is not blank
published = Yes
```

If no approved image exists, the website shows an image placeholder. Case-story images should come from public Google Drive URLs in `CaseStorySeeds`.

### 4. Case image privacy checklist

Before setting `image_consent_status` to `Consent received`, confirm:

- Image is public-safe.
- Consent for public website display has been received.
- No full recipient name is visible.
- No phone number is visible.
- No exact address is visible.
- No Aadhaar, PAN, bank, UPI, payment, or document detail is visible.
- No donor identity is visible.
- Google Drive sharing is set to “Anyone with the link can view.”

Never publish `image_publish_notes`; it is internal and not rendered publicly.

## Public privacy rules

- Never show full recipient names.
- Never show phone numbers.
- Never show exact addresses.
- Never show Aadhaar, PAN, bank details, UPI IDs, payment IDs, or private documents.
- Never show donor names.
- Never show `image_publish_notes`.
- Never show draft cases.
- Never show unpublished cases.
- Never show images without consent.

## Mentorship testimonials onboarding

Use the `MentorshipTestimonials` tab for public mentee testimonials.

### 1. Publish the tab

1. Open `Humanitarians_Public_Impact_Stats_Linked`.
2. Go to File > Share > Publish to web.
3. Choose the `MentorshipTestimonials` tab.
4. Choose CSV.
5. Copy the URL.
6. Paste it into:

```txt
VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL
```

Add the same variable in Netlify when deployed.

### 2. Fill testimonial fields

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

The website never renders `editing_note`.

### 3. Publishing rules

Testimonials appear only when:

```txt
consent_received = Yes
publish_status = Publish
```

If either value is different, the testimonial is hidden.

Do not publish placeholder rows. Replace placeholder copy with a real, approved testimonial before setting `publish_status` to `Publish`.

### 4. Testimonial privacy checklist

Before setting `publish_status` to `Publish`, confirm:

- Consent has been received.
- Testimonial is anonymized.
- No full name is included.
- No phone number is included.
- No exact address is included.
- No employer-sensitive/private detail is included.
- No donor name is included.
- No ID, document, payment, or bank detail is included.
- `editing_note` contains no public-facing content and will remain internal.

If there are no publishable testimonials, the website shows:

```txt
Mentee testimonials will appear here after consent and verification.
```

## Privacy checklist before publishing

- Do not show real full recipient names.
- Do not show phone numbers.
- Do not show addresses below city/state level.
- Do not show Aadhaar, PAN, bank details, UPI IDs, payment IDs, documents, medical documents, or private notes.
- Do not show donor names.
- Do not show testimonial `editing_note`.
- Do not show case image `image_publish_notes`.
- Do not show draft testimonials.
- Do not show images without consent.
- Public stories must stay anonymized to protect recipient dignity and privacy.
- Zakat and Sadaqah must remain tracked separately in monthly reports.
- Stats must be aggregated and privacy-safe.
- Do not claim government registration, 80G, FCRA, tax exemption, scholar certification, or a 100% Zakat policy unless verified editable copy is added later.

## Editable public content

- Public WhatsApp, email, UPI, bank, and CTA links live in `src/data/contact.ts`.
- Founder names live in `src/data/founders.ts`.
- Case story image galleries are built from public Google Drive URLs in `CaseStorySeeds`.
- General site copy and the About page profile download path live in `src/data/site.ts`.
- The About page profile PDF currently lives at `public/docs/humanitarians-impact-profile.pdf`.
- The website is live-data-only. Do not add saved public summary data.

When adding case images, add public Google Drive image URLs to `CaseStorySeeds` after consent and privacy review.

## GitHub setup

Create a GitHub repository:

1. Go to GitHub.
2. Click **New repository**.
3. Name it, for example:

```txt
humanitarians-website
```

4. Choose **Public** or **Private**.
5. Do not add a README, gitignore, or license on GitHub if this local project already has them.
6. Click **Create repository**.

Push this project:

```bash
cd /Users/daahmad/humanitarians
git init
git add .
git commit -m "Initial Humanitarians website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/humanitarians-website.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username or organization name.

For later updates:

```bash
git add .
git commit -m "Update website"
git push
```

Netlify will automatically redeploy after each push once the repository is connected.

## Free deployment on Netlify

Netlify is the recommended free deployment path for this MVP because it supports static Vite sites, automatic GitHub deploys, environment variables, HTTPS, and later custom domains.

1. Go to Netlify.
2. Sign up or log in.
3. Click **Add new site**.
4. Choose **Import an existing project**.
5. Select **GitHub**.
6. Authorize Netlify if asked.
7. Select the repository, for example:

```txt
humanitarians-website
```

8. Use these build settings:

```txt
Build command: npm run build
Publish directory: dist
```

9. Add environment variables in Netlify under **Site settings > Environment variables**:

```txt
VITE_STATS_MONTHLY_CSV_URL
VITE_STATS_SUPPORT_TYPES_CSV_URL
VITE_STATS_IMPACT_SUMMARY_CSV_URL
VITE_STATS_LAST_UPDATED_CSV_URL
VITE_STATS_REPORTS_CSV_URL
VITE_STATS_CASE_STORIES_CSV_URL
VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL
```

10. Click **Deploy site**.

Netlify will give a free public URL like:

```txt
https://your-site-name.netlify.app
```

You can rename the free Netlify subdomain in **Site settings > Site details > Change site name**.

## Direct route support

This app uses React Router. The file `public/_redirects` is required for Netlify so direct URLs such as `/about`, `/reports`, and `/case-stories` work after deployment.

The file contains:

```txt
/* /index.html 200
```

Vite copies this file into `dist/_redirects` during `npm run build`.

## Testing after deployment

Open the Netlify URL and test:

- `/`
- `/about`
- `/donate`
- `/case-stories`
- `/mentorship`
- `/reports`
- `/zakat-sadaqah`
- `/contact`

Also test:

- Donate / Join QR images load.
- Case story carousel images load.
- About page profile PDF downloads.
- Google Sheet stats show live data or a live-data-unavailable message.
- Mentorship testimonials appear only after `consent_received` is `Yes` and `publish_status` is `Publish`.
- Case story Google Drive images appear only when `image_consent_status` is `Consent received`.
- Direct refresh on `/about` and `/reports` works.
- External WhatsApp links open correctly.

## Updating the live website

After Netlify is connected to GitHub, every push to `main` triggers a new deployment:

```bash
git add .
git commit -m "Describe the change"
git push
```

If you update only Google Sheet data, you usually do not need to redeploy. The website fetches the public CSV URLs on page load with light cache busting.

## Buying and connecting a custom domain

First check whether the desired domain is available at a registrar such as:

- Cloudflare Registrar
- Namecheap
- GoDaddy
- Squarespace Domains
- Netlify Domains

Possible domain ideas:

```txt
humanitarians.com
humanitarians.org
humanitarians.in
humanitariansindia.org
indianhumanitarians.org
```

For a charity, `.org` or `.in` can be a strong choice if `.com` is unavailable.

After buying a domain:

1. Open the Netlify site dashboard.
2. Go to **Domain management**.
3. Click **Add a domain**.
4. Add the domain you own, for example:

```txt
www.yourdomain.org
```

5. Also add the root domain:

```txt
yourdomain.org
```

6. Set the primary domain, usually the `www` version:

```txt
www.yourdomain.org
```

7. Netlify will show DNS records.
8. Open the domain registrar dashboard.
9. Add the DNS records exactly as Netlify provides them.
10. Wait for DNS propagation. This can take a few minutes to 24-48 hours.
11. Netlify will automatically provision HTTPS/SSL.

Recommended final setup:

```txt
yourdomain.org -> redirects to www.yourdomain.org
www.yourdomain.org -> primary website
```

Keep the free Netlify URL as a backup preview/admin URL.

## Alternative deployment providers

This is a static Vite site, so it can also be deployed on Vercel, Cloudflare Pages, GitHub Pages, or similar static hosting. Configure the same `VITE_STATS_*_CSV_URL` environment variables in the hosting dashboard.

## No backend in this MVP

This MVP has no backend. A backend is only needed later for admin login, private case applications, document uploads, donor records, payment reconciliation, or mentor/mentee matching dashboards.
