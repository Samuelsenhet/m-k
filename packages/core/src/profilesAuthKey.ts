import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfilesAuthKey = "id" | "user_id";

let cachedProfilesAuthKey: ProfilesAuthKey | null = null;

function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; details?: string };
  const msg = `${e.message ?? ""} ${e.details ?? ""}`.toLowerCase();
  return (
    (e.code === "42703" &&
      msg.includes("column") &&
      msg.includes(column.toLowerCase())) ||
    msg.includes(`column "${column.toLowerCase()}"`) ||
    msg.includes(`column ${column.toLowerCase()}`)
  );
}

/**
 * Which column in `profiles` stores `auth.users.id` — mirrors web `getProfilesAuthKey`.
 */
export async function resolveProfilesAuthKey(
  supabase: SupabaseClient,
  authUserId?: string,
): Promise<ProfilesAuthKey> {
  if (cachedProfilesAuthKey) return cachedProfilesAuthKey;

  const probe = await supabase.from("profiles").select("user_id").limit(1);
  const userIdColumnExists = !probe.error;

  if (probe.error) {
    if (isMissingColumnError(probe.error, "user_id")) {
      cachedProfilesAuthKey = "id";
      return cachedProfilesAuthKey;
    }
    if (
      (probe.error as { code?: string }).code === "PGRST301" ||
      (probe.error as { status?: number }).status === 400
    ) {
      cachedProfilesAuthKey = "id";
      return cachedProfilesAuthKey;
    }
  }

  if (authUserId) {
    const [byId, byUserId] = await Promise.all([
      supabase.from("profiles").select("id").eq("id", authUserId).maybeSingle(),
      userIdColumnExists
        ? supabase
            .from("profiles")
            .select("user_id")
            .eq("user_id", authUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: probe.error }),
    ]);

    const idMatches = !!byId.data && !byId.error;
    const userIdMatches = !!byUserId.data && !byUserId.error;

    if (idMatches && !userIdMatches) {
      cachedProfilesAuthKey = "id";
      return cachedProfilesAuthKey;
    }
    if (userIdMatches && !idMatches) {
      cachedProfilesAuthKey = "user_id";
      return cachedProfilesAuthKey;
    }
    if (idMatches && userIdMatches) {
      cachedProfilesAuthKey = "user_id";
      return cachedProfilesAuthKey;
    }
  }

  if (userIdColumnExists) {
    cachedProfilesAuthKey = "user_id";
    return cachedProfilesAuthKey;
  }

  return "id";
}
