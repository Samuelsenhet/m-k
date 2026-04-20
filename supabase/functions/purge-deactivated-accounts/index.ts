/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * purge-deactivated-accounts
 *
 * Runs daily (pg_cron). Finds profiles where deactivated_at is older than
 * 90 days and hard-deletes the corresponding auth.users row. Every related
 * table has ON DELETE CASCADE on either auth.users(id) or profiles(id), so
 * one admin.deleteUser call cascades through matches, messages,
 * personality_results, profile_photos, user_achievements, subscriptions,
 * notifications, consents, privacy_settings, etc.
 *
 * Deploy: supabase functions deploy purge-deactivated-accounts --no-verify-jwt
 * Trigger: pg_cron (see 20260420110000_schedule_purge_deactivated.sql).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RETENTION_DAYS = 90;
const BATCH_LIMIT = 200;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const cutoffIso = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const { data: expired, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, deactivated_at")
      .not("deactivated_at", "is", null)
      .lt("deactivated_at", cutoffIso)
      .limit(BATCH_LIMIT);

    if (fetchErr) throw fetchErr;

    const ids = (expired ?? []).map((row) => row.id as string);
    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of ids) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(id);
      if (delErr) {
        failed.push({ id, error: delErr.message });
      } else {
        deleted.push(id);
      }
    }

    return new Response(
      JSON.stringify({
        cutoff: cutoffIso,
        scanned: ids.length,
        deleted: deleted.length,
        failed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("purge-deactivated-accounts error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
