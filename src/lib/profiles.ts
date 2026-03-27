import { resolveProfilesAuthKey, type ProfilesAuthKey } from "@maak/core";
import { supabase } from "@/integrations/supabase/client";

export type { ProfilesAuthKey };

/**
 * Which column in `profiles` stores `auth.users.id` — delegates to `@maak/core` (same cache as native).
 */
export async function getProfilesAuthKey(authUserId?: string): Promise<ProfilesAuthKey> {
  return resolveProfilesAuthKey(supabase, authUserId);
}
