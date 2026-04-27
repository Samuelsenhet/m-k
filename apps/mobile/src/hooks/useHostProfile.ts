import { useSupabase } from "@/contexts/SupabaseProvider";
import { useCallback, useEffect, useState } from "react";

/**
 * Värdar (Hosts program) - host_profiles state for the current user.
 *
 * See docs/VARDAR.md for the full spec. Status meaning:
 *   pending  - MÄÄK team has seen you as a candidate, hasn't approved yet
 *   active   - approved, can host Träffar, make introductions, see Värdrummet
 *   paused   - was active but dropped below activity floor (60 days inactive)
 *   declined - team reviewed and declined
 *   revoked  - was active, lost status due to moderation
 *
 * Client never writes this table - all transitions go through edge
 * functions (host-eligibility-check, host-approve, host-pause).
 */
export type HostStatus = "pending" | "active" | "paused" | "declined" | "revoked";

export interface HostProfile {
  status: HostStatus | null;
  isActive: boolean;
  isPending: boolean;
  isPaused: boolean;
  activatedAt: Date | null;
  lastActivityAt: Date | null;
  slug: string | null;
  bioExtended: string | null;
  coverImageId: string | null;
}

type HostProfileRow = {
  status: HostStatus;
  activated_at: string | null;
  last_activity_at: string | null;
  slug: string | null;
  bio_extended: string | null;
  cover_image_id: string | null;
};

function mapHostProfile(row: HostProfileRow | null): HostProfile {
  if (!row) {
    return {
      status: null,
      isActive: false,
      isPending: false,
      isPaused: false,
      activatedAt: null,
      lastActivityAt: null,
      slug: null,
      bioExtended: null,
      coverImageId: null,
    };
  }
  return {
    status: row.status,
    isActive: row.status === "active",
    isPending: row.status === "pending",
    isPaused: row.status === "paused",
    activatedAt: row.activated_at ? new Date(row.activated_at) : null,
    lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at) : null,
    slug: row.slug,
    bioExtended: row.bio_extended,
    coverImageId: row.cover_image_id,
  };
}

/**
 * Read-only host profile for the current user. Returns `status = null`
 * if no row exists, which is the common case for non-hosts. Don't
 * branch on `status === 'active'` - use the derived `isActive` flag.
 */
export function useHostProfile() {
  const { supabase, session } = useSupabase();
  const userId = session?.user?.id;

  const [profile, setProfile] = useState<HostProfile>(() => mapHostProfile(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from("host_profiles")
        .select(
          "status, activated_at, last_activity_at, slug, bio_extended, cover_image_id",
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (fetchError) throw fetchError;
      setProfile(mapHostProfile(data as HostProfileRow | null));
      setError(null);
    } catch (err) {
      // host_profiles table doesn't exist yet in production - swallow
      // the error cleanly so the rest of the app keeps working.
      if (__DEV__) console.log("useHostProfile (pre-launch, table may not exist):", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch host profile"));
      setProfile(mapHostProfile(null));
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    ...profile,
    loading,
    error,
    refreshHostProfile: fetchProfile,
  };
}
