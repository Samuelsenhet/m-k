/**
 * Detect 401 from supabase.functions.invoke (FunctionsHttpError shape).
 * Used to skip useless refreshSession retries when the Edge Function rejects JWT
 * (e.g. wrong deploy / secrets) — see docs/LAUNCH_401_CHECKLIST.md.
 */
export function isSupabaseInvokeUnauthorized(error: unknown): boolean {
  const errObj = error as { message?: string; context?: { status?: number } };
  const status = errObj?.context?.status;
  const msg = String(errObj?.message ?? "");
  return status === 401 || /401|unauthorized/i.test(msg);
}
