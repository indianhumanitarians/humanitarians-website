import {
  ACTIVE_DONOR_COMMUNITY_SETTING,
  PUBLIC_SITE_SETTING_DEFAULTS,
  publicSiteSettingDefaultRows,
  type PublicSiteSettingKey,
} from "../data/publicSiteSettings";
import {
  assertSupabaseConfigured,
  getSupabaseHeaders,
  supabaseConfig,
} from "./supabaseConfig";
import { supabaseRestRequest } from "./supabaseRest";

export { ACTIVE_DONOR_COMMUNITY_SETTING };

export interface SiteSetting {
  setting_key: string;
  setting_value: string;
  label: string;
  helper_text?: string | null;
  is_public: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PublicSiteSettingsRecord = Record<PublicSiteSettingKey, string>;

export const siteSettingValue = (
  settings: SiteSetting[],
  key: string,
  fallback = "",
): string =>
  settings.find((setting) => setting.setting_key === key)?.setting_value?.trim() ||
  fallback;

export const emptyPublicSiteSettingsRecord = (): PublicSiteSettingsRecord =>
  Object.fromEntries(
    Object.keys(PUBLIC_SITE_SETTING_DEFAULTS).map((key) => [key, ""]),
  ) as PublicSiteSettingsRecord;

export const publicSiteSettingsRecord = (
  settings: SiteSetting[] = [],
): PublicSiteSettingsRecord => {
  const values = emptyPublicSiteSettingsRecord();

  for (const setting of settings) {
    if (setting.setting_key in values) {
      values[setting.setting_key as PublicSiteSettingKey] =
        setting.setting_value?.trim() ?? "";
    }
  }

  return values;
};

export const fetchPublicSiteSettings = async (): Promise<SiteSetting[]> =>
  supabaseRestRequest<SiteSetting[]>("site_settings", {
    query: {
      select: "setting_key,setting_value,label,helper_text,is_public",
      is_public: "eq.true",
      order: "setting_key.asc",
    },
  });

export const fetchAdminSiteSettings = async (
  token: string,
): Promise<SiteSetting[]> =>
  supabaseRestRequest<SiteSetting[]>("site_settings", {
    token,
    query: {
      select: "*",
      order: "setting_key.asc",
    },
  });

export const updatePublicSiteSettings = async (
  token: string,
  values: Partial<PublicSiteSettingsRecord>,
): Promise<SiteSetting[]> => {
  const rows = publicSiteSettingDefaultRows
    .filter((row) => row.setting_key in values)
    .map((row) => ({
      ...row,
      setting_value: values[row.setting_key]?.trim() || row.setting_value,
    }));

  if (rows.length === 0) {
    return [];
  }

  return supabaseRestRequest<SiteSetting[]>("site_settings", {
    method: "POST",
    token,
    query: {
      on_conflict: "setting_key",
    },
    body: rows,
    prefer: "resolution=merge-duplicates,return=representation",
  });
};

export type PaymentQrKind = "sadaqah" | "zakat";

export type SiteSettingImageBucket = "payment-qr-images" | "site-setting-images";

export interface SiteSettingImageUpload {
  public_url: string;
  storage_path: string;
}

const sanitizeFileName = (fileName: string): string =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "payment-qr.png";

const encodeStoragePath = (path: string): string =>
  path.split("/").map(encodeURIComponent).join("/");

export const getSiteSettingImagePublicUrl = (
  bucket: SiteSettingImageBucket,
  path: string,
): string =>
  `${supabaseConfig.url}/storage/v1/object/public/${bucket}/${encodeStoragePath(path)}`;

export const getPaymentQrPublicUrl = (path: string): string =>
  getSiteSettingImagePublicUrl("payment-qr-images", path);

export const uploadSiteSettingImage = async (
  token: string,
  bucket: SiteSettingImageBucket,
  folder: string,
  file: File,
): Promise<SiteSettingImageUpload> => {
  assertSupabaseConfigured();

  const cleanedFolder = folder.replace(/^\/+|\/+$/g, "");
  const path = `${cleanedFolder}/image-${Date.now()}-${sanitizeFileName(file.name)}`;
  const response = await fetch(
    `${supabaseConfig.url}/storage/v1/object/${bucket}/${encodeStoragePath(path)}`,
    {
      method: "PUT",
      headers: getSupabaseHeaders(token, {
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      }),
      body: file,
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not upload QR image.");
  }

  return {
    public_url: getSiteSettingImagePublicUrl(bucket, path),
    storage_path: path,
  };
};

export const uploadPaymentQrImage = async (
  token: string,
  kind: PaymentQrKind,
  file: File,
): Promise<SiteSettingImageUpload> =>
  uploadSiteSettingImage(token, "payment-qr-images", `upi/${kind}`, file);

export const deleteSiteSettingImage = async (
  token: string,
  bucket: SiteSettingImageBucket,
  storagePath: string,
): Promise<void> => {
  const cleanedPath = storagePath.trim();
  if (!cleanedPath) {
    return;
  }

  assertSupabaseConfigured();

  const response = await fetch(
    `${supabaseConfig.url}/storage/v1/object/${bucket}/${encodeStoragePath(cleanedPath)}`,
    {
      method: "DELETE",
      headers: getSupabaseHeaders(token),
    },
  );

  if (!response.ok && response.status !== 404) {
    const message = await response.text();
    throw new Error(message || "Could not delete old setting image.");
  }
};

export const deletePaymentQrImage = async (
  token: string,
  storagePath: string,
): Promise<void> =>
  deleteSiteSettingImage(token, "payment-qr-images", storagePath);
