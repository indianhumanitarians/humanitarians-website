# Scripts Runbook

These scripts are local admin tools. Run them from the project root on your own machine.

Do not put private CSV exports, `.env`, or `SUPABASE_SERVICE_ROLE_KEY` in GitHub, Netlify frontend variables, or chat.

## What Each Script Does

```bash
npm run export:supabase-to-sheets
```

Exports the current Supabase private tables into CSV files for a private Google Sheets backup.

```bash
npm run import:sheets-to-supabase
```

Dry-runs an import from the new Google Sheets backup CSV tabs into Supabase. This does not write anything unless `--write` is added.

```bash
npm run merge:cases
```

Dry-runs a duplicate-case merge/repair in Supabase. This does not write anything unless `--write` is added.

## Export Supabase To Google Sheets Backup

Use this when Supabase has the correct/latest data and you want a fresh backup sheet.

1. Make sure `.env` has:

```txt
VITE_SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

2. Run:

```bash
npm run export:supabase-to-sheets
```

3. The script creates files in:

```txt
.google-sheets-export/
```

4. Upload/import these CSV files into a private Google Sheet:

```txt
case-ledger-latest.csv              -> Case Ledger
case-images-latest.csv              -> Case Images
mentorship-testimonials-latest.csv  -> Mentorship Testimonials
support-categories-latest.csv       -> Support Categories
fund-types-latest.csv               -> Fund Types
```

Recommended Google Sheets flow:

1. Create a blank Google Sheet.
2. Import `case-ledger-latest.csv` first with `Replace spreadsheet`.
3. Import the remaining CSVs with `Insert new sheet(s)`.
4. Rename the tabs exactly as shown above.
5. Keep the sheet private because it can contain beneficiary names, phone numbers, and addresses.

Optional custom export folder:

```bash
npm run export:supabase-to-sheets -- --out /path/to/private/export-folder
```

## Import Google Sheets Backup Into Supabase

Use this only when your private Google Sheet has become the data you want to push back into Supabase.

The importer expects the latest backup-sheet format only. It does not support the old Google Sheet columns.

Required tabs:

```txt
Case Ledger
Case Images
Mentorship Testimonials
Support Categories
Fund Types
```

1. Export/publish each tab as a CSV URL.

2. Put the CSV URLs in `.env`:

```txt
VITE_STATS_CASE_LEDGER_CSV_URL="..."
VITE_STATS_CASE_IMAGES_CSV_URL="..."
VITE_STATS_MENTORSHIP_TESTIMONIALS_CSV_URL="..."
VITE_STATS_SUPPORT_CATEGORIES_CSV_URL="..."
VITE_STATS_FUND_TYPES_CSV_URL="..."
VITE_SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

3. Dry run first:

```bash
npm run import:sheets-to-supabase
```

4. Read the output carefully.

5. If it looks correct, write to Supabase:

```bash
npm run import:sheets-to-supabase -- --write
```

6. After successful import, remove the CSV URLs and service key from `.env` if you do not need them immediately.

Important behavior:

- The importer upserts rows. Existing rows with the same `case_number`, `testimonial_id`, category name, or fund type name are updated.
- The importer does not delete Supabase rows just because they are missing from Google Sheets.
- Case image rows come from the `Case Images` tab.
- If a `Case Images` row already points to an existing Supabase Storage URL, the script preserves that file reference.
- If a `Case Images` row points to an external image URL, the script uploads it into the `case-images` Supabase Storage bucket when `--write` is used.

Skip image import:

```bash
npm run import:sheets-to-supabase -- --write --skip-images
```

## Restore One Deleted Case

Use this when one case was accidentally deleted in Supabase but still exists in the Google Sheets backup.

Dry run:

```bash
npm run import:sheets-to-supabase -- --case HUM-001
```

Write:

```bash
npm run import:sheets-to-supabase -- --case HUM-001 --write
```

This imports only that case and its matching `Case Images` rows. Mentorship testimonials are skipped in single-case restore mode.

## Merge Duplicate Cases

Use this when two case numbers represent the same real case.

Dry run:

```bash
npm run merge:cases -- --target HUM-059 --source HUM-061
```

Write:

```bash
npm run merge:cases -- --target HUM-059 --source HUM-061 --write
```

Meaning:

- `--target` is the case you keep.
- `--source` is the duplicate case that gets merged and deleted.
- The script creates a local backup in `.merge-backups/`.
- By default, later `HUM-###` cases are renumbered so the ledger stays naturally ordered.
- Case image database rows and Storage object folders are adjusted to match the final case numbers.

If the merged case should become one specific fund type:

```bash
npm run merge:cases -- --target HUM-059 --source HUM-061 --fund-type Sadaqah --amount-field sadaqah_amount
```

Then write:

```bash
npm run merge:cases -- --target HUM-059 --source HUM-061 --fund-type Sadaqah --amount-field sadaqah_amount --write
```

Supported amount fields:

```txt
zakat_amount
sadaqah_amount
other_amount
```

Useful flags:

```bash
--no-renumber
```

Keeps later case numbers unchanged.

```bash
--keep-source-storage
```

Leaves the duplicate source case's old Storage objects in the bucket for manual review.

## Safety Checklist

Before any write operation:

1. Run the command without `--write`.
2. Read the full output.
3. Confirm the target project URL in `.env`.
4. Confirm you are using the correct private Google Sheet.
5. Confirm `.env` and `.google-sheets-export/` are not committed.

After a write operation:

1. Check Supabase Table Editor.
2. Check the public website/admin panel locally.
3. Run a fresh export if you want Google Sheets to reflect the new Supabase state.
