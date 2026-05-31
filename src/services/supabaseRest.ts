import {
  assertSupabaseConfigured,
  getSupabaseHeaders,
  supabaseConfig,
} from "./supabaseConfig";

interface SupabaseRestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  prefer?: string;
}

const buildUrl = (
  path: string,
  query: SupabaseRestOptions["query"] = {},
): string => {
  const url = new URL(`${supabaseConfig.url}/rest/v1/${path.replace(/^\/+/, "")}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

export const supabaseRestRequest = async <T>(
  path: string,
  options: SupabaseRestOptions = {},
): Promise<T> => {
  assertSupabaseConfigured();

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: getSupabaseHeaders(options.token, {
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    }),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed (${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
};
