/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { getSupabaseEnv, verifySupabaseJWT } from "../_shared/env.ts";

/**
 * delete-user
 *
 * In-app account deletion (Apple guideline 5.1.1(v)). Caller's JWT identifies
 * who they are; we only delete that same user. The schema has ON DELETE CASCADE
 * on auth.users(id) / profiles(id) so this single call wipes matches, messages,
 * personality_results, profile_photos, subscriptions, notifications, etc.
 * (See purge-deactivated-accounts for the same cascade contract.)
 *
 * Deploy: supabase functions deploy delete-user
 *   (verify-jwt is on by default — keep it; we cross-check caller below.)
 */

serve(async (req) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const env = getSupabaseEnv(req);
  if (env instanceof Response) return env;

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerId = await verifySupabaseJWT(
    authHeader,
    env.supabaseUrl,
    env.supabaseAnonKey,
  );
  if (!callerId) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Optional userId in body — must match caller. Defending against client bugs
  // that might pass another id; the JWT is the source of truth either way.
  let bodyUserId: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body.userId === "string") bodyUserId = body.userId;
  } catch {
    /* empty body is fine */
  }
  if (bodyUserId && bodyUserId !== callerId) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "service_role_missing" }),
      {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  const admin = createClient(env.supabaseUrl, serviceRoleKey);

  const { error: delErr } = await admin.auth.admin.deleteUser(callerId);
  if (delErr) {
    console.error("[delete-user] admin.deleteUser failed:", delErr);
    return new Response(JSON.stringify({ error: delErr.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ deleted: callerId }),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});
