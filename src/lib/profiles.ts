import { supabase } from '@/integrations/supabase/client';

export type ProfilesAuthKey = 'id' | 'user_id';

let cachedProfilesAuthKey: ProfilesAuthKey | null = null;

function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; details?: string };
  const msg = `${e.message ?? ''} ${e.details ?? ''}`.toLowerCase();
  return (
    (e.code === '42703' && msg.includes('column') && msg.includes(column.toLowerCase())) ||
    msg.includes(`column "${column.toLowerCase()}"`) ||
    msg.includes(`column ${column.toLowerCase()}`)
  );
}

/**
 * Returns which column in `profiles` corresponds to `auth.users.id`.
 *
 * Some projects use `profiles.id` as the auth user id, others use `profiles.user_id`.
 * We detect this once per session. If both columns exist, we try to infer which one
 * matches a known auth user id by querying with filters.
 */
export async function getProfilesAuthKey(authUserId?: string): Promise<ProfilesAuthKey> {
  if (cachedProfilesAuthKey) return cachedProfilesAuthKey;

  // Probe whether `user_id` exists (avoid 400 if column or table missing).
  const probe = await supabase.from('profiles').select('user_id').limit(1);
  const userIdColumnExists = !probe.error;

  if (probe.error) {
    if (isMissingColumnError(probe.error, 'user_id')) {
      cachedProfilesAuthKey = 'id';
      return cachedProfilesAuthKey;
    }
    // 400/404 (e.g. table missing, RLS, or bad request) — assume id-based profiles.
    if ((probe.error as { code?: string }).code === 'PGRST301' || (probe.error as { status?: number }).status === 400) {
      cachedProfilesAuthKey = 'id';
      return cachedProfilesAuthKey;
    }
  }

  // If we have a user id to test, try to infer which column it matches.
  if (authUserId) {
    const [byId, byUserId] = await Promise.all([
      supabase.from('profiles').select('id').eq('id', authUserId).maybeSingle(),
      userIdColumnExists
        ? supabase.from('profiles').select('user_id').eq('user_id', authUserId).maybeSingle()
        : Promise.resolve({ data: null, error: probe.error }),
    ]);

    const idMatches = !!byId.data && !byId.error;
    const userIdMatches = !!byUserId.data && !byUserId.error;

    if (idMatches && !userIdMatches) {
      cachedProfilesAuthKey = 'id';
      return cachedProfilesAuthKey;
    }
    if (userIdMatches && !idMatches) {
      cachedProfilesAuthKey = 'user_id';
      return cachedProfilesAuthKey;
    }
    if (idMatches && userIdMatches) {
      // Either column works; default to `user_id` when available.
      cachedProfilesAuthKey = 'user_id';
      return cachedProfilesAuthKey;
    }
    // Not enough info (e.g. profile row doesn't exist yet) — don't cache.
  }

  if (userIdColumnExists) {
    cachedProfilesAuthKey = 'user_id';
    return cachedProfilesAuthKey;
  }

  // If we hit an auth/RLS/network error during probing, don't cache a guess.
  return 'id';
}

