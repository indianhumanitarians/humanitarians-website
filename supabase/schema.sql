-- Humanitarians admin/data backend.
-- Run this once in the Supabase SQL editor for the project backing the site.

create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('owner', 'admin', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value text not null default '',
  label text not null default '',
  helper_text text not null default '',
  is_public boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fund_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  case_number text primary key,
  reporting_month text not null,
  reporting_month_sort integer,
  reporting_month_start date,
  support_category text not null default '',
  support_description text not null default '',
  fund_source text not null default '',
  zakat_amount numeric(12, 2) not null default 0,
  sadaqah_amount numeric(12, 2) not null default 0,
  other_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) generated always as (
    coalesce(zakat_amount, 0) + coalesce(sadaqah_amount, 0) + coalesce(other_amount, 0)
  ) stored,
  beneficiary_name text,
  beneficiary_phone text,
  beneficiary_private_location text,
  public_story_title text,
  public_location text,
  public_need_summary text,
  public_support_summary text,
  public_outcome_summary text,
  public_follow_up_summary text,
  show_in_public_stats boolean not null default false,
  publish_public_story boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_images (
  id uuid primary key default gen_random_uuid(),
  case_number text not null references public.cases(case_number) on update cascade on delete cascade,
  display_order integer not null check (display_order between 1 and 3),
  storage_path text not null,
  public_url text not null,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_number, display_order)
);

create table if not exists public.mentorship_testimonials (
  testimonial_id text primary key,
  anonymized_name text not null default '',
  public_role text not null default '',
  mentorship_track text not null default '',
  mentee_stage text not null default '',
  public_location text not null default '',
  period_label text not null default '',
  outcome_summary text not null default '',
  testimonial_text text not null default '',
  profile_image_storage_path text,
  profile_image_url text,
  carousel_tagline text not null default '',
  consent_received boolean not null default false,
  privacy_note text not null default '',
  editing_note text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop view if exists public.public_case_stories;
drop view if exists public.public_case_ledger;
drop view if exists public.public_mentorship_testimonials;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'case_code')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'case_number') then
    alter table public.cases rename column case_code to case_number;
  end if;
end $$;

do $$
declare
  audit_table regclass;
  audit_table_name text;
begin
  foreach audit_table_name in array array[
    'public.site_settings',
    'public.support_categories',
    'public.fund_types',
    'public.cases',
    'public.case_images',
    'public.mentorship_testimonials'
  ]
  loop
    audit_table := audit_table_name::regclass;

    execute format('alter table %s drop constraint if exists %I', audit_table, replace(audit_table_name, 'public.', '') || '_created_by_fkey');
    execute format('alter table %s drop constraint if exists %I', audit_table, replace(audit_table_name, 'public.', '') || '_updated_by_fkey');

    execute format(
      'alter table %s alter column created_by type text using created_by::text',
      audit_table
    );
    execute format(
      'alter table %s alter column updated_by type text using updated_by::text',
      audit_table
    );

    execute format(
      'update %s as target set created_by = admin_profiles.email from public.admin_profiles where target.created_by = admin_profiles.user_id::text',
      audit_table
    );
    execute format(
      'update %s as target set updated_by = admin_profiles.email from public.admin_profiles where target.updated_by = admin_profiles.user_id::text',
      audit_table
    );
  end loop;
end $$;

alter table public.case_images add column if not exists case_number text;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'case_images' and column_name = 'case_id')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'id') then
    update public.case_images
    set case_number = cases.case_number
    from public.cases
    where case_images.case_id = cases.id
      and case_images.case_number is null;
  end if;
end $$;

alter table public.case_images drop constraint if exists case_images_case_id_fkey;
alter table public.case_images drop constraint if exists case_images_case_number_fkey;
alter table public.case_images drop constraint if exists case_images_case_id_display_order_key;
alter table public.case_images drop column if exists case_id;

alter table public.cases drop constraint if exists cases_pkey;
alter table public.cases alter column case_number set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.cases'::regclass
      and contype = 'p'
  ) then
    alter table public.cases add constraint cases_pkey primary key (case_number);
  end if;
end $$;

alter table public.cases drop constraint if exists cases_case_number_key;
alter table public.cases drop column if exists id;

alter table public.mentorship_testimonials drop constraint if exists mentorship_testimonials_pkey;
alter table public.mentorship_testimonials alter column testimonial_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.mentorship_testimonials'::regclass
      and contype = 'p'
  ) then
    alter table public.mentorship_testimonials
      add constraint mentorship_testimonials_pkey primary key (testimonial_id);
  end if;
end $$;

alter table public.mentorship_testimonials drop constraint if exists mentorship_testimonials_testimonial_id_key;
alter table public.mentorship_testimonials add column if not exists profile_image_storage_path text;
alter table public.mentorship_testimonials
  drop column if exists id,
  drop column if exists display_order,
  drop column if exists profile_image_alt,
  drop column if exists publish_status;

delete from public.case_images
where case_number is null;

alter table public.case_images alter column case_number set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.case_images'::regclass
      and conname = 'case_images_case_number_display_order_key'
  ) then
    alter table public.case_images
      add constraint case_images_case_number_display_order_key unique (case_number, display_order);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.case_images'::regclass
      and conname = 'case_images_case_number_fkey'
  ) then
    alter table public.case_images
      add constraint case_images_case_number_fkey
      foreign key (case_number) references public.cases(case_number)
      on update cascade on delete cascade;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cases'
      and column_name = 'image_url_1'
  ) then
    execute $sql$
      insert into public.case_images (case_number, display_order, storage_path, public_url, created_at, updated_at)
      select case_number, 1, regexp_replace(image_url_1, '^.*/storage/v1/object/public/case-images/', ''), image_url_1, now(), now()
      from public.cases
      where nullif(trim(image_url_1), '') is not null
      on conflict (case_number, display_order) do update
      set public_url = excluded.public_url,
          storage_path = excluded.storage_path,
          updated_at = now()
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cases'
      and column_name = 'image_url_2'
  ) then
    execute $sql$
      insert into public.case_images (case_number, display_order, storage_path, public_url, created_at, updated_at)
      select case_number, 2, regexp_replace(image_url_2, '^.*/storage/v1/object/public/case-images/', ''), image_url_2, now(), now()
      from public.cases
      where nullif(trim(image_url_2), '') is not null
      on conflict (case_number, display_order) do update
      set public_url = excluded.public_url,
          storage_path = excluded.storage_path,
          updated_at = now()
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cases'
      and column_name = 'image_url_3'
  ) then
    execute $sql$
      insert into public.case_images (case_number, display_order, storage_path, public_url, created_at, updated_at)
      select case_number, 3, regexp_replace(image_url_3, '^.*/storage/v1/object/public/case-images/', ''), image_url_3, now(), now()
      from public.cases
      where nullif(trim(image_url_3), '') is not null
      on conflict (case_number, display_order) do update
      set public_url = excluded.public_url,
          storage_path = excluded.storage_path,
          updated_at = now()
    $sql$;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'case_code')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'case_number') then
    alter table public.cases rename column case_code to case_number;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'period_label')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'reporting_month') then
    alter table public.cases rename column period_label to reporting_month;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'period_sort')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'reporting_month_sort') then
    alter table public.cases rename column period_sort to reporting_month_sort;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'month_start')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'reporting_month_start') then
    alter table public.cases rename column month_start to reporting_month_start;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'category')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'support_category') then
    alter table public.cases rename column category to support_category;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'support_type')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'support_description') then
    alter table public.cases rename column support_type to support_description;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'fund_type')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'fund_source') then
    alter table public.cases rename column fund_type to fund_source;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'amount_zakat')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'zakat_amount') then
    alter table public.cases rename column amount_zakat to zakat_amount;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'amount_sadaqah')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'sadaqah_amount') then
    alter table public.cases rename column amount_sadaqah to sadaqah_amount;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'recipient_name')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'beneficiary_name') then
    alter table public.cases rename column recipient_name to beneficiary_name;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'recipient_phone')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'beneficiary_phone') then
    alter table public.cases rename column recipient_phone to beneficiary_phone;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'recipient_location')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'beneficiary_private_location') then
    alter table public.cases rename column recipient_location to beneficiary_private_location;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'public_title')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'public_story_title') then
    alter table public.cases rename column public_title to public_story_title;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'need_public')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'public_need_summary') then
    alter table public.cases rename column need_public to public_need_summary;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'support_provided_public')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'public_support_summary') then
    alter table public.cases rename column support_provided_public to public_support_summary;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'outcome_public')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'public_outcome_summary') then
    alter table public.cases rename column outcome_public to public_outcome_summary;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'follow_up_public')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'public_follow_up_summary') then
    alter table public.cases rename column follow_up_public to public_follow_up_summary;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'include_in_public_stats')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'show_in_public_stats') then
    alter table public.cases rename column include_in_public_stats to show_in_public_stats;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'published')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'publish_public_story') then
    alter table public.cases rename column published to publish_public_story;
  end if;
end $$;

alter table public.cases drop column if exists total_amount;
alter table public.cases
  add column if not exists total_amount numeric(12, 2) generated always as (
    coalesce(zakat_amount, 0) + coalesce(sadaqah_amount, 0) + coalesce(other_amount, 0)
  ) stored;

alter table public.cases
  drop column if exists public_beneficiary_label,
  drop column if exists public_display_name,
  drop column if exists image_consent_status,
  drop column if exists image_url_1,
  drop column if exists image_alt_1,
  drop column if exists image_url_2,
  drop column if exists image_alt_2,
  drop column if exists image_url_3,
  drop column if exists image_alt_3,
  drop column if exists need_private,
  drop column if exists private_need_notes,
  drop column if exists support_provided_private,
  drop column if exists private_support_notes,
  drop column if exists outcome_private,
  drop column if exists private_outcome_notes,
  drop column if exists follow_up_private,
  drop column if exists private_follow_up_notes,
  drop column if exists status,
  drop column if exists case_status,
  drop column if exists verification_notes,
  drop column if exists internal_notes;

create or replace function public.reporting_month_label(period_sort integer)
returns text
language sql
immutable
as $$
  select case period_sort % 100
    when 1 then 'Jan'
    when 2 then 'Feb'
    when 3 then 'Mar'
    when 4 then 'Apr'
    when 5 then 'May'
    when 6 then 'Jun'
    when 7 then 'Jul'
    when 8 then 'Aug'
    when 9 then 'Sep'
    when 10 then 'Oct'
    when 11 then 'Nov'
    when 12 then 'Dec'
    else null
  end || ' ' || (period_sort / 100)::integer
  where period_sort between 190001 and 299912
    and period_sort % 100 between 1 and 12;
$$;

create or replace function public.reporting_month_sort_from_label(period_label text)
returns integer
language sql
immutable
as $$
  select case
    when period_label ~ '^\d{4}-\d{2}$'
      and substring(period_label from 6 for 2)::integer between 1 and 12
      then substring(period_label from 1 for 4)::integer * 100
        + substring(period_label from 6 for 2)::integer
    when lower(split_part(trim(period_label), ' ', 1)) in ('jan', 'january')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 1
    when lower(split_part(trim(period_label), ' ', 1)) in ('feb', 'february')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 2
    when lower(split_part(trim(period_label), ' ', 1)) in ('mar', 'march')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 3
    when lower(split_part(trim(period_label), ' ', 1)) in ('apr', 'april')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 4
    when lower(split_part(trim(period_label), ' ', 1)) = 'may'
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 5
    when lower(split_part(trim(period_label), ' ', 1)) in ('jun', 'june')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 6
    when lower(split_part(trim(period_label), ' ', 1)) in ('jul', 'july')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 7
    when lower(split_part(trim(period_label), ' ', 1)) in ('aug', 'august')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 8
    when lower(split_part(trim(period_label), ' ', 1)) in ('sep', 'sept', 'september')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 9
    when lower(split_part(trim(period_label), ' ', 1)) in ('oct', 'october')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 10
    when lower(split_part(trim(period_label), ' ', 1)) in ('nov', 'november')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 11
    when lower(split_part(trim(period_label), ' ', 1)) in ('dec', 'december')
      then split_part(trim(period_label), ' ', 2)::integer * 100 + 12
    else null
  end
  where trim(coalesce(period_label, '')) ~ '^([A-Za-z]+ \d{4}|\d{4}-\d{2})$';
$$;

create or replace function public.reporting_month_start_from_sort(period_sort integer)
returns date
language sql
immutable
as $$
  select make_date((period_sort / 100)::integer, period_sort % 100, 1)
  where period_sort between 190001 and 299912
    and period_sort % 100 between 1 and 12;
$$;

with normalized_case_months as (
  select
    case_number,
    coalesce(
      reporting_month_sort,
      public.reporting_month_sort_from_label(reporting_month)
    ) as period_sort
  from public.cases
)
update public.cases
set reporting_month = coalesce(
      public.reporting_month_label(normalized_case_months.period_sort),
      public.cases.reporting_month
    ),
    reporting_month_sort = normalized_case_months.period_sort,
    reporting_month_start = coalesce(
      public.cases.reporting_month_start,
      public.reporting_month_start_from_sort(normalized_case_months.period_sort)
    )
from normalized_case_months
where public.cases.case_number = normalized_case_months.case_number
  and normalized_case_months.period_sort is not null;

insert into public.site_settings (
  setting_key,
  setting_value,
  label,
  helper_text,
  is_public
)
values (
  'active_donor_community',
  '150+',
  'Active donor community',
  'Shown on the homepage and reports as the donor community size.',
  true
), (
  'contact_email',
  'indianhumanitarians@gmail.com',
  'Contact email',
  'Used in the footer and contact page.',
  true
), (
  'about_profile_url',
  'https://drive.google.com/file/d/18NIxGJpotj_TCZmThOB1-y8djLhNwP0u/view?usp=drivesdk',
  'About/profile document URL',
  'The external link behind the About page profile button.',
  true
), (
  'whatsapp_mentor_volunteer_group_url',
  'https://chat.whatsapp.com/IKQhWIXlQDW5azPfuRSL64?mode=gi_t',
  'Mentor volunteer WhatsApp URL',
  'Used by Contact and Mentorship pages for mentor volunteers.',
  true
), (
  'whatsapp_mentee_group_url',
  'https://chat.whatsapp.com/CZYDCNhhIwWARydpIK1hm7?mode=gi_t',
  'Mentee WhatsApp URL',
  'Used by the Mentorship page for mentee requests.',
  true
), (
  'case_referral_form_url',
  'https://forms.gle/j25asHA6ekoLqxEn8',
  'Case referral form URL',
  'Google Form opened by public Refer a Case buttons.',
  true
), (
  'whatsapp_new_members_group_url',
  'https://chat.whatsapp.com/ICHmOfadrBnAReSB568crd?mode=gi_t',
  'New Members WhatsApp URL',
  'Main donor/community WhatsApp group link.',
  true
), (
  'whatsapp_new_members_qr_image',
  '/images/humanitarians-new-members-whatsapp-qr.jpeg',
  'New Members WhatsApp QR',
  'QR image shown on the Donate page for the new members WhatsApp group.',
  true
), (
  'whatsapp_new_members_qr_storage_path',
  '',
  'New Members WhatsApp QR storage path',
  'Internal storage path for the uploaded new members WhatsApp QR.',
  false
), (
  'upi_sadaqah_display_name',
  'Mohammad Aqib',
  'Sadaqah UPI display name',
  'Name shown on the Sadaqah payment card.',
  true
), (
  'upi_sadaqah_upi_id',
  '8957768755@jupiteraxis',
  'Sadaqah UPI ID',
  'UPI ID and app deep-link value for Sadaqah.',
  true
), (
  'upi_sadaqah_qr_image',
  '/images/upi-sadaqah-mohammad-aqib.png',
  'Sadaqah QR image URL/path',
  'Public image URL or site path for the Sadaqah QR.',
  true
), (
  'upi_sadaqah_qr_storage_path',
  '',
  'Sadaqah QR storage path',
  'Internal storage path for the uploaded Sadaqah QR.',
  false
), (
  'upi_zakat_display_name',
  'Shahil Siddiqui',
  'Zakat UPI display name',
  'Name shown on the Zakat payment card.',
  true
), (
  'upi_zakat_upi_id',
  '9565596161@jupiteraxis',
  'Zakat UPI ID',
  'UPI ID and app deep-link value for Zakat.',
  true
), (
  'upi_zakat_qr_image',
  '/images/upi-zakat-sahil-siddiqui.png',
  'Zakat QR image URL/path',
  'Public image URL or site path for the Zakat QR.',
  true
), (
  'upi_zakat_qr_storage_path',
  '',
  'Zakat QR storage path',
  'Internal storage path for the uploaded Zakat QR.',
  false
), (
  'bank_account_name',
  'Humanitarians',
  'Bank account name',
  'Shown in the bank transfer section.',
  true
), (
  'bank_account_number',
  'Editable placeholder',
  'Bank account number',
  'Shown in the bank transfer section.',
  true
), (
  'bank_ifsc',
  'Editable placeholder',
  'Bank IFSC',
  'Shown in the bank transfer section.',
  true
), (
  'bank_branch',
  'Editable placeholder',
  'Bank branch',
  'Shown in the bank transfer section.',
  true
)
on conflict (setting_key) do update
set label = excluded.label,
    helper_text = excluded.helper_text,
    is_public = excluded.is_public;

insert into public.support_categories (name, display_order)
values
  ('Livelihood', 10),
  ('Skill Sponsorship', 20),
  ('Education Support', 30),
  ('Course Sponsorship', 40),
  ('Emergency Support', 50),
  ('Community Support', 60)
on conflict (name) do nothing;

insert into public.support_categories (name)
select distinct trim(support_category)
from public.cases
where nullif(trim(support_category), '') is not null
on conflict (name) do nothing;

insert into public.fund_types (name, display_order)
values
  ('Zakat', 10),
  ('Sadaqah', 20),
  ('Mixed', 30),
  ('Other', 40)
on conflict (name) do nothing;

insert into public.fund_types (name)
select distinct trim(fund_source)
from public.cases
where nullif(trim(fund_source), '') is not null
on conflict (name) do nothing;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = $1
      and admin_profiles.role in ('admin', 'owner')
  );
$$;

create or replace function public.is_owner(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = $1
      and admin_profiles.role = 'owner'
  );
$$;

drop index if exists public.cases_period_sort_idx;
drop index if exists public.cases_public_idx;
drop index if exists public.case_images_case_id_idx;
drop index if exists public.mentorship_testimonials_public_idx;

create index if not exists cases_reporting_month_sort_idx on public.cases(reporting_month_sort desc);
create index if not exists cases_public_visibility_idx on public.cases(show_in_public_stats, publish_public_story);
create index if not exists cases_created_at_idx on public.cases(created_at desc);
create index if not exists case_images_case_number_idx on public.case_images(case_number, display_order);
create index if not exists mentorship_testimonials_public_idx on public.mentorship_testimonials(consent_received, created_at);
create index if not exists site_settings_public_idx on public.site_settings(is_public, setting_key);
create index if not exists support_categories_active_order_idx on public.support_categories(is_active, display_order, name);
create index if not exists fund_types_active_order_idx on public.fund_types(is_active, display_order, name);

create or replace function public.set_admin_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text;
begin
  select admin_profiles.email
  into actor_email
  from public.admin_profiles
  where admin_profiles.user_id = auth.uid();

  actor_email := coalesce(
    actor_email,
    nullif(auth.jwt() ->> 'email', ''),
    auth.uid()::text
  );

  new.updated_at = now();
  new.updated_by = actor_email;

  if tg_op = 'INSERT' then
    new.created_by = actor_email;
  end if;

  return new;
end;
$$;

drop trigger if exists cases_set_audit_fields on public.cases;
create trigger cases_set_audit_fields
before insert or update on public.cases
for each row execute function public.set_admin_audit_fields();

drop trigger if exists site_settings_set_audit_fields on public.site_settings;
create trigger site_settings_set_audit_fields
before insert or update on public.site_settings
for each row execute function public.set_admin_audit_fields();

drop trigger if exists support_categories_set_audit_fields on public.support_categories;
create trigger support_categories_set_audit_fields
before insert or update on public.support_categories
for each row execute function public.set_admin_audit_fields();

drop trigger if exists fund_types_set_audit_fields on public.fund_types;
create trigger fund_types_set_audit_fields
before insert or update on public.fund_types
for each row execute function public.set_admin_audit_fields();

drop trigger if exists case_images_set_audit_fields on public.case_images;
create trigger case_images_set_audit_fields
before insert or update on public.case_images
for each row execute function public.set_admin_audit_fields();

drop trigger if exists mentorship_testimonials_set_audit_fields on public.mentorship_testimonials;
create trigger mentorship_testimonials_set_audit_fields
before insert or update on public.mentorship_testimonials
for each row execute function public.set_admin_audit_fields();

create or replace function public.public_safe_amount(amount numeric)
returns numeric
language sql
immutable
as $$
  select case
    when coalesce(amount, 0) <= 0 then 0
    when amount < 5000 then 2500
    when amount <= 10000 then 7500
    when amount <= 25000 then 17500
    when amount <= 50000 then 37500
    when amount <= 100000 then 75000
    else 100000
  end;
$$;

create or replace function public.public_amount_range(amount numeric)
returns text
language sql
immutable
as $$
  select case
    when coalesce(amount, 0) <= 0 then ''
    when amount < 5000 then 'Under ₹5,000'
    when amount <= 10000 then '₹5,000-₹10,000'
    when amount <= 25000 then '₹10,000-₹25,000'
    when amount <= 50000 then '₹25,000-₹50,000'
    when amount <= 100000 then '₹50,000-₹1,00,000'
    else 'More than ₹1,00,000'
  end;
$$;

drop view if exists public.public_case_stories;
drop view if exists public.public_case_ledger;
drop view if exists public.public_mentorship_testimonials;

create or replace view public.public_case_ledger as
select
  cases.case_number,
  cases.show_in_public_stats,
  cases.publish_public_story,
  cases.reporting_month,
  cases.reporting_month_sort,
  cases.reporting_month_start,
  cases.support_category,
  cases.support_description,
  public.public_safe_amount(cases.zakat_amount) as zakat_amount,
  public.public_safe_amount(cases.sadaqah_amount) as sadaqah_amount,
  public.public_safe_amount(cases.other_amount) as other_amount,
  public.public_safe_amount(cases.total_amount) as total_amount,
  cases.fund_source,
  case when cases.publish_public_story then coalesce(nullif(cases.public_story_title, ''), 'Anonymized support case') else '' end as public_story_title,
  case when cases.publish_public_story then cases.public_location else '' end as public_location,
  public.public_amount_range(cases.total_amount) as amount_range,
  case when cases.publish_public_story then cases.public_need_summary else '' end as public_need_summary,
  case when cases.publish_public_story then cases.public_support_summary else '' end as public_support_summary,
  case when cases.publish_public_story then cases.public_outcome_summary else '' end as public_outcome_summary,
  case when cases.publish_public_story then cases.public_follow_up_summary else '' end as public_follow_up_summary,
  case when cases.publish_public_story then coalesce(images.case_image_1_url, '') else '' end as case_image_1_url,
  case when cases.publish_public_story and coalesce(images.case_image_1_url, '') <> '' then format('Case image for %s', coalesce(nullif(cases.public_story_title, ''), 'anonymous support case')) else '' end as case_image_1_alt,
  case when cases.publish_public_story then coalesce(images.case_image_2_url, '') else '' end as case_image_2_url,
  case when cases.publish_public_story and coalesce(images.case_image_2_url, '') <> '' then format('Case image for %s', coalesce(nullif(cases.public_story_title, ''), 'anonymous support case')) else '' end as case_image_2_alt,
  case when cases.publish_public_story then coalesce(images.case_image_3_url, '') else '' end as case_image_3_url,
  case when cases.publish_public_story and coalesce(images.case_image_3_url, '') <> '' then format('Case image for %s', coalesce(nullif(cases.public_story_title, ''), 'anonymous support case')) else '' end as case_image_3_alt
from public.cases
left join lateral (
  select
    max(ranked.public_url) filter (where ranked.image_rank = 1) as case_image_1_url,
    max(ranked.public_url) filter (where ranked.image_rank = 2) as case_image_2_url,
    max(ranked.public_url) filter (where ranked.image_rank = 3) as case_image_3_url
  from (
    select
      case_images.public_url,
      row_number() over (
        order by case_images.display_order, case_images.created_at, case_images.id
      ) as image_rank
    from public.case_images
    where case_images.case_number = cases.case_number
  ) as ranked
) as images on true
where cases.show_in_public_stats = true or cases.publish_public_story = true;

create or replace view public.public_case_stories as
select *
from public.public_case_ledger
where publish_public_story = true;

create or replace view public.public_mentorship_testimonials as
select
  testimonial_id,
  anonymized_name,
  public_role,
  mentorship_track,
  mentee_stage,
  public_location,
  period_label,
  outcome_summary,
  testimonial_text,
  profile_image_url,
  case when coalesce(profile_image_url, '') <> '' then format('Profile image for %s', coalesce(nullif(anonymized_name, ''), 'anonymous mentee')) else '' end as profile_image_alt,
  carousel_tagline,
  consent_received,
  privacy_note
from public.mentorship_testimonials
where consent_received = true;

alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.support_categories enable row level security;
alter table public.fund_types enable row level security;
alter table public.cases enable row level security;
alter table public.case_images enable row level security;
alter table public.mentorship_testimonials enable row level security;

drop policy if exists "Admin profiles are visible to their owner" on public.admin_profiles;
create policy "Admin profiles are visible to their owner"
on public.admin_profiles for select
using (auth.uid() = user_id or public.is_owner(auth.uid()));

drop policy if exists "Admins can manage admin profiles" on public.admin_profiles;
drop policy if exists "Owners can manage admin profiles" on public.admin_profiles;
create policy "Owners can manage admin profiles"
on public.admin_profiles for all
using (public.is_owner(auth.uid()))
with check (public.is_owner(auth.uid()));

drop policy if exists "Public site settings are readable" on public.site_settings;
create policy "Public site settings are readable"
on public.site_settings for select
to anon, authenticated
using (is_public = true or public.is_admin(auth.uid()));

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage support categories" on public.support_categories;
create policy "Admins can manage support categories"
on public.support_categories for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage fund types" on public.fund_types;
create policy "Admins can manage fund types"
on public.fund_types for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage cases" on public.cases;
create policy "Admins can manage cases"
on public.cases for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage case images" on public.case_images;
create policy "Admins can manage case images"
on public.case_images for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage mentorship testimonials" on public.mentorship_testimonials;
create policy "Admins can manage mentorship testimonials"
on public.mentorship_testimonials for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.public_case_ledger to anon, authenticated;
grant select on public.public_case_stories to anon, authenticated;
grant select on public.public_mentorship_testimonials to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.admin_profiles to authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.support_categories to authenticated;
grant select, insert, update, delete on public.fund_types to authenticated;
grant select, insert, update, delete on public.cases to authenticated;
grant select, insert, update, delete on public.case_images to authenticated;
grant select, insert, update, delete on public.mentorship_testimonials to authenticated;

insert into storage.buckets (id, name, public)
values ('case-images', 'case-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('testimonial-images', 'testimonial-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-qr-images', 'payment-qr-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-setting-images', 'site-setting-images', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can read public case images" on storage.objects;
create policy "Anyone can read public case images"
on storage.objects for select
using (bucket_id = 'case-images');

drop policy if exists "Anyone can read public testimonial images" on storage.objects;
create policy "Anyone can read public testimonial images"
on storage.objects for select
using (bucket_id = 'testimonial-images');

drop policy if exists "Anyone can read public payment QR images" on storage.objects;
create policy "Anyone can read public payment QR images"
on storage.objects for select
using (bucket_id = 'payment-qr-images');

drop policy if exists "Anyone can read public site setting images" on storage.objects;
create policy "Anyone can read public site setting images"
on storage.objects for select
using (bucket_id = 'site-setting-images');

drop policy if exists "Admins can upload public case images" on storage.objects;
create policy "Admins can upload public case images"
on storage.objects for insert
with check (bucket_id = 'case-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can upload public testimonial images" on storage.objects;
create policy "Admins can upload public testimonial images"
on storage.objects for insert
with check (bucket_id = 'testimonial-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can upload public payment QR images" on storage.objects;
create policy "Admins can upload public payment QR images"
on storage.objects for insert
with check (bucket_id = 'payment-qr-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can upload public site setting images" on storage.objects;
create policy "Admins can upload public site setting images"
on storage.objects for insert
with check (bucket_id = 'site-setting-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can update public case images" on storage.objects;
create policy "Admins can update public case images"
on storage.objects for update
using (bucket_id = 'case-images' and public.is_admin(auth.uid()))
with check (bucket_id = 'case-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can update public testimonial images" on storage.objects;
create policy "Admins can update public testimonial images"
on storage.objects for update
using (bucket_id = 'testimonial-images' and public.is_admin(auth.uid()))
with check (bucket_id = 'testimonial-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can update public payment QR images" on storage.objects;
create policy "Admins can update public payment QR images"
on storage.objects for update
using (bucket_id = 'payment-qr-images' and public.is_admin(auth.uid()))
with check (bucket_id = 'payment-qr-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can update public site setting images" on storage.objects;
create policy "Admins can update public site setting images"
on storage.objects for update
using (bucket_id = 'site-setting-images' and public.is_admin(auth.uid()))
with check (bucket_id = 'site-setting-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can delete public case images" on storage.objects;
create policy "Admins can delete public case images"
on storage.objects for delete
using (bucket_id = 'case-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can delete public testimonial images" on storage.objects;
create policy "Admins can delete public testimonial images"
on storage.objects for delete
using (bucket_id = 'testimonial-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can delete public payment QR images" on storage.objects;
create policy "Admins can delete public payment QR images"
on storage.objects for delete
using (bucket_id = 'payment-qr-images' and public.is_admin(auth.uid()));

drop policy if exists "Admins can delete public site setting images" on storage.objects;
create policy "Admins can delete public site setting images"
on storage.objects for delete
using (bucket_id = 'site-setting-images' and public.is_admin(auth.uid()));
