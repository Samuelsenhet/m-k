import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AiFunctionKey = "ai_assistant" | "generate_icebreakers" | "generate_followups";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf.split(",")[0]!.trim();
  const xff = req.headers.get("x-forwarded-for")?.trim();
  if (xff) return xff.split(",")[0]!.trim();
  return "unknown";
}

function utcMinuteStart(d = new Date()): string {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0, 0),
  ).toISOString();
}

function utcHourStart(d = new Date()): string {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0),
  ).toISOString();
}

function utcDayStart(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)).toISOString();
}

/** Europe/Stockholm calendar day (YYYY-MM-DD) for daily buckets aligned with match-daily. */
export function stockholmDayKey(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Stockholm" });
}

const STOCKHOLM_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function stockholmDayIndexUtcMs(ms: number): number {
  const p = STOCKHOLM_PARTS.formatToParts(new Date(ms));
  const g = (t: Intl.DateTimeFormatPartTypes) =>
    parseInt(p.find((x) => x.type === t)?.value ?? "", 10);
  const y = g("year");
  const mo = g("month");
  const d = g("day");
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return -1;
  return y * 10000 + mo * 100 + d;
}

/**
 * UTC instant when `dayKey` (YYYY-MM-DD) starts in Europe/Stockholm (00:00 local).
 * Not the same as `Date.UTC(y,m,d)` — Stockholm midnight falls on a different UTC wall time.
 */
export function stockholmDayStartIso(dayKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey.trim());
  if (!m) return utcDayStart();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return utcDayStart();
  const targetIdx = y * 10000 + mo * 100 + d;

  let lo = Date.UTC(y, mo - 1, d, 0, 0, 0, 0) - 30 * 24 * 3600000;
  let hi = Date.UTC(y, mo - 1, d, 0, 0, 0, 0) + 30 * 24 * 3600000;
  if (stockholmDayIndexUtcMs(hi) < targetIdx || stockholmDayIndexUtcMs(lo) > targetIdx) {
    return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0)).toISOString();
  }
  while (stockholmDayIndexUtcMs(lo) >= targetIdx) lo -= 24 * 3600000;
  while (stockholmDayIndexUtcMs(hi) < targetIdx) hi += 24 * 3600000;

  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (stockholmDayIndexUtcMs(mid) >= targetIdx) hi = mid;
    else lo = mid;
  }
  return new Date(hi).toISOString();
}

function subscriptionIsPaid(row: {
  plan_type?: string | null;
  status?: string | null;
  expires_at?: string | null;
} | null): boolean {
  if (!row || row.status !== "active") return false;
  const notExpired = !row.expires_at || new Date(row.expires_at) > new Date();
  const plan = row.plan_type ?? "";
  return notExpired && (plan === "premium" || plan === "vip");
}

async function consume(
  supabase: SupabaseClient,
  key: string,
  windowStart: string,
  max: number,
): Promise<{ allowed: boolean; count: number }> {
  if (max <= 0) return { allowed: true, count: 0 };
  const { data, error } = await supabase.rpc("try_consume_rate_limit", {
    p_key: key,
    p_window_start: windowStart,
    p_max: max,
  });
  if (error) {
    console.error("[rate_limit_db] try_consume_rate_limit error:", error);
    // Fail closed: do not bypass limits when Postgres/RPC is down or misconfigured.
    return { allowed: false, count: 0 };
  }
  const row = data as { allowed?: boolean; count?: number; skipped?: boolean } | null;
  if (row?.skipped) return { allowed: true, count: 0 };
  // Fail closed: only explicit allowed: true passes; null/malformed RPC payload denies.
  return { allowed: row?.allowed === true, count: Number(row?.count ?? 0) };
}

/**
 * Enforce global daily cap + per-user + per-IP buckets (Postgres-backed).
 * Returns null if OK, or a Response to return from the Edge handler.
 */
export async function enforceAiRateLimits(
  supabase: SupabaseClient,
  req: Request,
  userId: string,
  fn: AiFunctionKey,
): Promise<Response | null> {
  const ip = getClientIp(req);

  const globalMax = parsePositiveInt(Deno.env.get("AI_GLOBAL_DAILY_MAX_CALLS"), 0);
  if (globalMax > 0) {
    const day = utcDayStart();
    const gKey = "global:ai:calls:utc_day";
    const g = await consume(supabase, gKey, day, globalMax);
    if (!g.allowed) {
      return new Response(
        JSON.stringify({
          error: "AI-tjänsten är tillfälligt begränsad. Försök igen senare.",
          code: "ai_global_cap",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const freeTierDayMax = parsePositiveInt(Deno.env.get("AI_RATE_FREE_TIER_PER_DAY"), 0);
  if (freeTierDayMax > 0) {
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("plan_type, status, expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (!subscriptionIsPaid(subRow)) {
      const userDayKey = stockholmDayKey();
      const userDayStart = stockholmDayStartIso(userDayKey);
      const fr = await consume(
        supabase,
        `user:${userId}:${fn}:free_tier_day_sthlm`,
        userDayStart,
        freeTierDayMax,
      );
      if (!fr.allowed) {
        return new Response(
          JSON.stringify({
            error: "Du har nått dagens gräns för AI-förslag. Uppgradera eller försök igen imorgon.",
            code: "free_tier_ai_cap",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "3600",
            },
          },
        );
      }
    }
  }

  const userPerMinute = parsePositiveInt(Deno.env.get("AI_RATE_USER_PER_MINUTE"), 24);
  const userPerDay = parsePositiveInt(Deno.env.get("AI_RATE_USER_PER_DAY"), 150);
  const ipPerMinute = parsePositiveInt(Deno.env.get("AI_RATE_IP_PER_MINUTE"), 40);
  const ipPerHour = parsePositiveInt(Deno.env.get("AI_RATE_IP_PER_HOUR"), 200);

  const min = utcMinuteStart();
  const hour = utcHourStart();
  const userDayKey = stockholmDayKey();
  const userDayStart = stockholmDayStartIso(userDayKey);

  const checks: Array<Promise<{ allowed: boolean; label: string }>> = [
    consume(supabase, `user:${userId}:${fn}:minute`, min, userPerMinute).then((r) => ({
      allowed: r.allowed,
      label: "user_minute",
    })),
    consume(supabase, `user:${userId}:${fn}:day_sthlm`, userDayStart, userPerDay).then((r) => ({
      allowed: r.allowed,
      label: "user_day",
    })),
    consume(supabase, `ip:${ip}:${fn}:minute`, min, ipPerMinute).then((r) => ({
      allowed: r.allowed,
      label: "ip_minute",
    })),
    consume(supabase, `ip:${ip}:${fn}:hour`, hour, ipPerHour).then((r) => ({
      allowed: r.allowed,
      label: "ip_hour",
    })),
  ];

  const results = await Promise.all(checks);
  const failed = results.find((x) => !x.allowed);
  if (failed) {
    return new Response(
      JSON.stringify({
        error: "För många förfrågningar. Vänta en stund och försök igen.",
        code: "rate_limited",
        scope: failed.label,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      },
    );
  }

  return null;
}

/** Service-role client for rate limit RPC (callers pass URL + service key). */
export function createServiceClient(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey);
}
