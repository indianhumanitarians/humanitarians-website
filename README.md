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
- Tailwind CSS v4
- Supabase Auth, Postgres, Row Level Security, and Supabase Storage for case images

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
- `/admin/login` - Authorized admin sign-in
- `/admin` - Private case ledger dashboard
- `/admin/cases/new` - Add a new private case record
- `/admin/admins` - Owner-only admin invitations and access management

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

Preview the production build:

```bash
npm run preview
```

## Environment Variables

The public site and admin panel use Supabase only. A legacy spreadsheet can be used once as an import source, but it is not used by the deployed website.

Required local variables:

```txt
VITE_SUPABASE_URL="..."
VITE_SUPABASE_ANON_KEY="..."
```

Rules:

- Keep real values in `.env`.
- Commit only `.env.example`.
- Public stats/case stories are read from the `public_case_ledger` view.
- Public mentorship testimonials are read from the `public_mentorship_testimonials` view.
- Add the same variables in Netlify or any other hosting provider.
- Do not add `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` to frontend hosting variables.

## Supabase Backend Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the one latest schema file: `supabase/schema.sql`.
4. Create the first owner user in Supabase Auth.
5. Insert the first owner in SQL:

```sql
insert into public.admin_profiles (user_id, email, role)
select id, email, 'owner'
from auth.users
where email = 'admin@example.com';
```

6. Deploy the owner-only invite function:

```bash
supabase functions deploy invite-admin --no-verify-jwt
```

The function verifies the logged-in user itself and only allows users with `role = 'owner'` to invite admins.

In Supabase Auth URL settings, add these redirect URLs before sending invites:

```txt
http://localhost:5173/admin/login
http://localhost:5173/admin/accept-invite
https://your-domain.example/admin/login
https://your-domain.example/admin/accept-invite
```

Only users in `admin_profiles` with role `owner` or `admin` can use `/admin`. Owners can invite and manage admins from `/admin/admins`. The private tables have Row Level Security enabled, and anonymous users only receive the filtered views `public_case_ledger`, `public_case_stories`, and `public_mentorship_testimonials`.

## One-Time Legacy Sheet Import

Spreadsheet data is not used at runtime. To migrate existing rows into Supabase, keep these local-only variables in `.env` temporarily:

```txt
VITE_STATS_CASE_LEDGER_CSV_URL="..."
VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

Use the legacy `service_role` key or a server-only Supabase secret key only on your own machine for this import. Never put it in browser code, Netlify frontend variables, GitHub, or chat.

Dry run:

```bash
npm run import:supabase
```

Write rows and copy case images into the public `case-images` Supabase Storage bucket:

```bash
npm run import:supabase -- --write
```

Skip image copying if you want to import rows first:

```bash
npm run import:supabase -- --write --skip-images
```

Restore one deleted case from the legacy sheet without touching testimonials or every other case:

```bash
npm run import:supabase -- --case HUM-001 --write
```

After the import succeeds, remove the legacy sheet URLs and service key from `.env`.

## Public Data Source

Supabase is the source of truth. The private `cases` table stores the admin ledger. The private `case_images` table stores image records after files are uploaded to Supabase Storage. The public `public_case_ledger` view exposes only anonymized fields and approximate amount buckets. It drives:

- Public stats
- Monthly reports
- Support-type charts
- Fund-type charts
- Case stories
- Homepage impact numbers

Do not store private recipient, donor, phone, address, document, verification, or bank data in public views.

## CaseLedger Publishing Rules

Rows are included in public stats only when the private `cases.show_in_public_stats` field is enabled. In the public view this appears as:

```txt
case_number is not blank
show_in_public_stats = true
```

Rows appear as public case stories only when:

```txt
case_number is not blank
publish_public_story = true
```

Important behavior:

- Rows without `case_number` are ignored.
- `reporting_month_sort` is preferred for sorting when present.
- If `reporting_month_sort` is missing, the app tries to parse `reporting_month`, for example `Jan 2026`.
- `total_amount` is used when present; otherwise the app calculates it from `zakat_amount`, `sadaqah_amount`, and `other_amount`.
- If `fund_source` is blank, the app derives it from the amount columns.
- Case-story images come from the private `case_images` table and are exposed only through the public view for published stories.
- Reports are derived live from the configured public-safe source; there are no saved public report rows in the repo.

## Mentorship Testimonials

The private `mentorship_testimonials` table stores testimonial rows.

Testimonials appear only when:

```txt
consent_received = true
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
privacy_note
```

Internal field:

```txt
editing_note
```

The public view does not expose `editing_note`.

If there are no publishable testimonials, the mentorship page shows a safe empty state.

## Case Images

Case images are uploaded to Supabase Storage in the public `case-images` bucket. The private `case_images` table stores the resulting storage path and public URL:

```txt
case_id
display_order
storage_path
public_url
```

Rules:

- Use only public-safe images.
- Do not publish images that show full names, phone numbers, addresses, IDs, payment details, bank details, UPI IDs, donor identities, or private documents.
- The admin form accepts file uploads only; it does not ask admins to paste image URLs, captions, alt text, or image consent status.
- Public alt text is generated from the public story title.
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
- Testimonials without consent
- Images without consent
- `editing_note`

Keep public reporting aggregated and anonymized. Do not claim government registration, 80G, FCRA, tax exemption, scholar certification, or a 100% Zakat policy unless verified public copy is added later.

## Editable Website Content

Common editable content locations:

- Contact, WhatsApp, UPI, bank, QR, and CTA links: `src/data/contact.ts`
- General site copy and external profile URL: `src/data/site.ts`
- FAQs: `src/data/faq.ts`
- Case-story image handling: `src/components/cases/CaseImageCarousel.tsx`
- Public stats derivation: `src/services/caseLedgerStats.ts`
- Supabase data and image storage helpers: `src/services/adminCases.ts`

Public assets:

- Header/footer logo mark: `public/images/logo-mark-transparent.png`
- Legacy logo: `public/images/logo.jpeg`
- Favicon: `public/favicon-32x32.png`
- Apple touch icon: `public/apple-touch-icon.png`
- WhatsApp QR: `public/images/humanitarians-new-members-whatsapp-qr.jpeg`
- Zakat UPI QR: `public/images/upi-zakat-sahil-siddiqui.png`
- Sadaqah UPI QR: `public/images/upi-sadaqah-mohammad-aqib.png`

## Local-Only Files And Git Ignore

The following files and folders are intentionally ignored:

```txt
.env
.env.local
.env.*.local
```

## Deployment On Netlify

Netlify is the recommended free deployment path for this static Vite site.

Build settings:

```txt
Build command: npm run build
Publish directory: dist
```

Add these environment variables in Netlify:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

After Netlify is connected to GitHub, every push to `main` triggers a deployment.

If Supabase case data changes, a redeploy is not needed because the site fetches the public-safe view on page load.

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
- `/admin/login`

Also verify:

- Donate and Join QR images load.
- UPI buttons open correctly on supported devices.
- WhatsApp links open correctly.
- Case-story carousel images load or show placeholders.
- Profile button opens the Google Drive profile file from the About page.
- Public stats show Supabase data or a clear unavailable state.
- Authorized users can sign in to `/admin` and add a case.
- Mentorship testimonials appear only after consent is recorded.
- Direct refresh works on routes such as `/about` and `/reports`.

## Custom Domain Notes

The site can use Netlify's free subdomain or a custom domain.

Recommended setup for a custom domain:

```txt
yourdomain.org -> redirects to www.yourdomain.org
www.yourdomain.org -> primary website
```

After buying a domain, add it in Netlify under Domain management, copy the DNS records Netlify provides into the registrar, and wait for DNS and HTTPS provisioning.

## Backend Notes

This site uses Supabase as the backend for admin login, private case records, public-safe views, and case image storage. Donor records, payment reconciliation, mentor/mentee matching, and document uploads are not part of the current implementation.

## Admin Data Repair

Use the duplicate-case merge script only for local admin repair. It is a dry run unless `--write` is passed.

```bash
npm run merge:cases -- --target HUM-059 --source HUM-061
npm run merge:cases -- --target HUM-059 --source HUM-061 --write
```

By default, the script keeps the target case, deletes the source case, adds the source amounts into the matching amount columns on the target (`zakat_amount`, `sadaqah_amount`, `other_amount`), copies source images into empty target image slots, and writes a local backup in `.merge-backups/`.

If the merged case should become one specific fund type, force the fund and amount column:

```bash
npm run merge:cases -- --target HUM-059 --source HUM-061 --fund-type Sadaqah --amount-field sadaqah_amount
npm run merge:cases -- --target HUM-059 --source HUM-061 --fund-type Sadaqah --amount-field sadaqah_amount --write
```

Supported `--amount-field` values are `zakat_amount`, `sadaqah_amount`, and `other_amount`. Short aliases like `zakat`, `sadaqah`, and `other` also work. If `--fund-type` is passed without `--amount-field`, the script guesses the amount column from the fund type name.

By default it also renumbers later `HUM-###` cases down by one and moves each affected case image object into the matching storage folder. Add `--no-renumber` to skip that, or `--keep-source-storage` if you want to leave the duplicate case's old image objects in the bucket for manual review.

Always run the dry run first and read the full plan before adding `--write`.
