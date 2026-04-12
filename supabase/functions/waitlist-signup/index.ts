/// <reference types="https://deno.land/x/types/index.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCE = "landing_vanta";

const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function sha256Hex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  const cors = corsHeadersFor(req, "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured" }, 503, cors);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === "GET") {
    const { count, error } = await supabase
      .from("waitlist_signups")
      .select("*", { count: "exact", head: true })
      .eq("source", SOURCE);

    if (error) {
      console.error("[waitlist-signup] count error:", error);
      return json({ count: 0, avatars: [] }, 200, cors);
    }

    const { data: recent } = await supabase
      .from("waitlist_signups")
      .select("email")
      .eq("source", SOURCE)
      .order("created_at", { ascending: false })
      .limit(4);

    const avatars = await Promise.all(
      (recent ?? []).map((r: { email: string }) => sha256Hex(r.email.trim().toLowerCase())),
    );

    return json({ count: count ?? 0, avatars }, 200, cors);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  if (isRateLimited(clientIp(req))) {
    return json({ error: "Too many requests" }, 429, cors);
  }

  const body = await req.json().catch(() => ({}));
  const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(rawEmail)) {
    return json({ error: "Invalid email" }, 400, cors);
  }

  const { error: insertError } = await supabase
    .from("waitlist_signups")
    .insert({ email: rawEmail, source: SOURCE });

  if (insertError) {
    const code = (insertError as { code?: string }).code;
    if (code === "23505") {
      return json({ success: true, already_signed_up: true }, 200, cors);
    }
    console.error("[waitlist-signup] insert error:", insertError);
    return json({ error: "Server error" }, 500, cors);
  }

  return json({ success: true }, 200, cors);
});
