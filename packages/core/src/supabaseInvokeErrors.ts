/**
 * Detect 401 from supabase.functions.invoke (FunctionsHttpError shape).
 * Shared by web and Expo — see docs/LAUNCH_401_CHECKLIST.md.
 */
export function isSupabaseInvokeUnauthorized(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const errObj = error as {
    message?: string;
    status?: number;
    context?: unknown;
  };
  const ctx = errObj.context;
  let status: number | undefined = errObj.status;
  if (typeof status !== "number" && ctx != null && typeof ctx === "object") {
    if (typeof Response !== "undefined" && ctx instanceof Response) {
      status = ctx.status;
    } else {
      const c = ctx as { status?: number; response?: { status?: number } };
      status = c.status ?? c.response?.status;
    }
  }
  const msg = String(errObj.message ?? "");
  return status === 401 || /401|unauthorized/i.test(msg);
}
