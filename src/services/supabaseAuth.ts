import type { AdminProfile, AdminSession, AuthUser } from "../types/admin";
import {
  assertSupabaseConfigured,
  getSupabaseHeaders,
  supabaseConfig,
} from "./supabaseConfig";
import { supabaseRestRequest } from "./supabaseRest";

const SESSION_STORAGE_KEY = "humanitarians.admin.session.v1";

interface SupabaseAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

interface SupabaseUserResponse {
  id: string;
  email?: string;
}

const authRequest = async <T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> => {
  assertSupabaseConfigured();

  const response = await fetch(`${supabaseConfig.url}/auth/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: getSupabaseHeaders(token, {
      "Content-Type": "application/json",
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Authentication failed (${response.status}).`);
  }

  return (await response.json()) as T;
};

const toAdminSession = (response: SupabaseAuthResponse): AdminSession => ({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresAt: Date.now() + response.expires_in * 1000,
  user: response.user,
});

const getUrlAuthParams = (): URLSearchParams => {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  hashParams.forEach((value, key) => {
    params.set(key, value);
  });

  return params;
};

export const hasInviteOrRecoveryTokenInUrl = (): boolean => {
  const params = getUrlAuthParams();
  const type = params.get("type");
  return (
    Boolean(params.get("access_token")) &&
    (type === "invite" || type === "recovery" || type === null)
  );
};

export const getSessionFromInviteUrl = async (): Promise<AdminSession> => {
  const params = getUrlAuthParams();
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const errorDescription = params.get("error_description") ?? params.get("error");

  if (errorDescription) {
    throw new Error(errorDescription);
  }

  if (!accessToken || !refreshToken) {
    throw new Error("This invite link is missing its session token.");
  }

  const user = await authRequest<SupabaseUserResponse>("user", undefined, accessToken);
  const expiresAtParam = Number(params.get("expires_at"));
  const expiresInParam = Number(params.get("expires_in"));
  const expiresAt = Number.isFinite(expiresAtParam) && expiresAtParam > 0
    ? expiresAtParam * 1000
    : Date.now() + (Number.isFinite(expiresInParam) ? expiresInParam : 3600) * 1000;

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

export const updateAdminPassword = async (
  session: AdminSession,
  password: string,
): Promise<void> => {
  assertSupabaseConfigured();

  const response = await fetch(`${supabaseConfig.url}/auth/v1/user`, {
    method: "PUT",
    headers: getSupabaseHeaders(session.accessToken, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Password update failed (${response.status}).`);
  }
};

export const saveAdminSession = (session: AdminSession): void => {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearAdminSession = (): void => {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const getStoredAdminSession = (): AdminSession | undefined => {
  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return undefined;
  }

  try {
    return JSON.parse(rawSession) as AdminSession;
  } catch {
    clearAdminSession();
    return undefined;
  }
};

export const refreshAdminSession = async (
  session: AdminSession,
): Promise<AdminSession> => {
  const response = await authRequest<SupabaseAuthResponse>(
    "token?grant_type=refresh_token",
    { refresh_token: session.refreshToken },
  );
  const refreshedSession = toAdminSession(response);
  saveAdminSession(refreshedSession);
  return refreshedSession;
};

export const getUsableAdminSession = async (): Promise<AdminSession | undefined> => {
  const session = getStoredAdminSession();
  if (!session) {
    return undefined;
  }

  if (session.expiresAt - Date.now() > 60000) {
    return session;
  }

  return refreshAdminSession(session);
};

export const fetchAdminProfile = async (
  session: AdminSession,
): Promise<AdminProfile | undefined> => {
  const profiles = await supabaseRestRequest<AdminProfile[]>("admin_profiles", {
    token: session.accessToken,
    query: {
      select: "user_id,email,role",
      user_id: `eq.${session.user.id}`,
      limit: 1,
    },
  });

  return profiles[0];
};

export const signInWithPassword = async (
  email: string,
  password: string,
): Promise<{ session: AdminSession; profile: AdminProfile }> => {
  const response = await authRequest<SupabaseAuthResponse>(
    "token?grant_type=password",
    { email, password },
  );
  const session = toAdminSession(response);
  const profile = await fetchAdminProfile(session);

  if (!profile || profile.role === "viewer") {
    clearAdminSession();
    throw new Error("This account is not authorized for the admin panel.");
  }

  saveAdminSession(session);
  return { session, profile };
};

export const signOutAdmin = async (session?: AdminSession): Promise<void> => {
  try {
    if (session) {
      await fetch(`${supabaseConfig.url}/auth/v1/logout`, {
        method: "POST",
        headers: getSupabaseHeaders(session.accessToken),
      });
    }
  } finally {
    clearAdminSession();
  }
};
