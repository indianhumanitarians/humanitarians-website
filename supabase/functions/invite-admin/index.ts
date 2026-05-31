import { createClient } from "npm:@supabase/supabase-js@2";

type AdminRole = "owner" | "admin";

interface InviteAdminRequest {
  email?: unknown;
  role?: unknown;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const getServiceRoleKey = (): string | undefined => {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) {
    return legacyKey;
  }

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) {
    return undefined;
  }

  try {
    const parsedKeys = JSON.parse(secretKeys) as Record<string, string>;
    return parsedKeys.default ?? Object.values(parsedKeys)[0];
  } catch {
    return undefined;
  }
};

const normalizeEmail = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeRole = (value: unknown): AdminRole | undefined => {
  if (value === "owner" || value === "admin") {
    return value;
  }

  return undefined;
};

const findUserByEmail = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
) => {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );
    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return undefined;
    }
  }

  return undefined;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase function secrets are not configured." }, 500);
  }

  const authorizationHeader = request.headers.get("Authorization") ?? "";
  const accessToken = authorizationHeader.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return jsonResponse({ error: "Missing admin session." }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: currentUserData, error: currentUserError } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (currentUserError || !currentUserData.user) {
    return jsonResponse({ error: "Invalid admin session." }, 401);
  }

  const { data: ownerProfile, error: ownerError } = await supabaseAdmin
    .from("admin_profiles")
    .select("user_id,email,role")
    .eq("user_id", currentUserData.user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerError) {
    return jsonResponse({ error: ownerError.message }, 500);
  }

  if (!ownerProfile) {
    return jsonResponse({ error: "Only owners can invite admins." }, 403);
  }

  let payload: InviteAdminRequest;
  try {
    payload = (await request.json()) as InviteAdminRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const email = normalizeEmail(payload.email);
  const role = normalizeRole(payload.role);

  if (!isValidEmail(email)) {
    return jsonResponse({ error: "A valid email is required." }, 400);
  }

  if (!role) {
    return jsonResponse({ error: "Role must be admin or owner." }, 400);
  }

  const origin = request.headers.get("Origin");
  const redirectTo = origin
    ? `${origin.replace(/\/+$/, "")}/admin/accept-invite`
    : undefined;
  const { data: invitedUserData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { invited_role: role },
    });

  let invitedUser = invitedUserData.user;
  if (inviteError || !invitedUser) {
    const existingUser = await findUserByEmail(supabaseAdmin, email);
    if (!existingUser) {
      return jsonResponse(
        {
          error:
            inviteError?.message ??
            "Could not invite this admin. Check Supabase Auth email settings.",
        },
        400,
      );
    }

    const { error: resetError } =
      await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });

    if (resetError) {
      return jsonResponse({ error: resetError.message }, 400);
    }

    invitedUser = existingUser;
  }

  if (!invitedUser) {
    return jsonResponse(
      { error: "Could not locate the invited admin user." },
      400,
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .upsert(
      {
        user_id: invitedUser.id,
        email,
        role,
      },
      { onConflict: "user_id" },
    )
    .select("user_id,email,role,created_at")
    .single();

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  return jsonResponse({ profile });
});
