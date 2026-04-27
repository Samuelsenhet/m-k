import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Strict UUID (hex + dashes only) so values are safe inside PostgREST filter strings. */
function isValidUuid(value: string | undefined | null): value is string {
  return (
    typeof value === "string" &&
    value.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/**
 * Resolve the matched peer for a user, enforcing match participation (IDOR-safe).
 * - If matchId is set: load match row; caller must be user_id or matched_user_id; return the other user.
 * - Else if matchedUserId is set: require an existing matches row pairing caller and peer (either direction).
 * Returns null if unauthorized or not found.
 */
export async function resolveMatchedPeerId(
  supabase: SupabaseClient,
  callerId: string,
  matchedUserId: string | undefined,
  matchId: string | undefined,
): Promise<string | null> {
  if (!isValidUuid(callerId)) return null;

  if (matchId) {
    if (!isValidUuid(matchId)) return null;
    const { data: row, error } = await supabase
      .from("matches")
      .select("user_id, matched_user_id")
      .eq("id", matchId)
      .single();

    if (error || !row) return null;
    if (row.user_id !== callerId && row.matched_user_id !== callerId) return null;
    const peer = row.user_id === callerId ? row.matched_user_id : row.user_id;
    // Optional client hint: reject if it does not match server-derived peer (IDOR hardening).
    if (matchedUserId !== undefined && matchedUserId !== null && matchedUserId !== "") {
      if (!isValidUuid(matchedUserId) || matchedUserId !== peer) return null;
    }
    return peer;
  }

  if (matchedUserId) {
    if (!isValidUuid(matchedUserId)) return null;
    const { data, error } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user_id.eq.${callerId},matched_user_id.eq.${matchedUserId}),and(user_id.eq.${matchedUserId},matched_user_id.eq.${callerId})`,
      )
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return matchedUserId;
  }

  return null;
}
