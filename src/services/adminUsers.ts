import type { AdminProfile } from "../types/admin";
import { getSupabaseHeaders, supabaseConfig } from "./supabaseConfig";
import { supabaseRestRequest } from "./supabaseRest";

export type AdminWritableRole = "owner" | "admin";

interface InviteAdminInput {
  email: string;
  role: AdminWritableRole;
}

interface InviteAdminResponse {
  profile: AdminProfile;
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text();
  if (!text) {
    return `Request failed (${response.status}).`;
  }

  try {
    const body = JSON.parse(text) as { error?: string; message?: string };
    return body.error ?? body.message ?? text;
  } catch {
    return text;
  }
};

export const fetchAdminProfiles = async (
  token: string,
): Promise<AdminProfile[]> =>
  supabaseRestRequest<AdminProfile[]>("admin_profiles", {
    token,
    query: {
      select: "user_id,email,role,created_at",
      order: "role.desc,email.asc",
    },
  });

export const inviteAdmin = async (
  token: string,
  input: InviteAdminInput,
): Promise<AdminProfile> => {
  const response = await fetch(`${supabaseConfig.url}/functions/v1/invite-admin`, {
    method: "POST",
    headers: getSupabaseHeaders(token, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const body = (await response.json()) as InviteAdminResponse;
  return body.profile;
};

export const updateAdminRole = async (
  token: string,
  userId: string,
  role: AdminWritableRole,
): Promise<AdminProfile> => {
  const [profile] = await supabaseRestRequest<AdminProfile[]>("admin_profiles", {
    method: "PATCH",
    token,
    query: {
      user_id: `eq.${userId}`,
    },
    body: { role },
    prefer: "return=representation",
  });

  return profile;
};

export const removeAdminAccess = async (
  token: string,
  userId: string,
): Promise<void> => {
  await supabaseRestRequest<void>("admin_profiles", {
    method: "DELETE",
    token,
    query: {
      user_id: `eq.${userId}`,
    },
    prefer: "return=minimal",
  });
};
