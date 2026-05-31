const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const normalizeUrl = (url: string | undefined): string => (url ?? "").replace(/\/+$/, "");

const isPlaceholder = (value: string): boolean =>
  value.trim() === "" || value.includes("PASTE_") || value.includes("YOUR_");

export const supabaseConfig = {
  url: normalizeUrl(rawSupabaseUrl),
  anonKey: rawSupabaseAnonKey ?? "",
};

export const isSupabaseConfigured =
  !isPlaceholder(supabaseConfig.url) && !isPlaceholder(supabaseConfig.anonKey);

export const getSupabaseHeaders = (
  token?: string,
  extraHeaders?: HeadersInit,
): HeadersInit => ({
  apikey: supabaseConfig.anonKey,
  Authorization: `Bearer ${token ?? supabaseConfig.anonKey}`,
  ...extraHeaders,
});

export const assertSupabaseConfigured = (): void => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
};
