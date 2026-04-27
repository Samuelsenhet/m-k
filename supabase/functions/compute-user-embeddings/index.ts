/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { embed, isEmbedSuccess, toPgVector } from "../_shared/embeddings.ts";

/**
 * compute-user-embeddings
 *
 * Runs daily (00:45 CET, after match-daily and compute-engagement-scores).
 * For users whose signals are stale (>7 days) or absent, computes:
 *   - bio_embedding         — embedding of profiles.bio
 *   - answers_embedding     — embedding of concatenated free-text profile
 *                             fields (work, education, hometown, dating
 *                             intention extras, etc.)
 * and upserts into public.user_signals. Other v1.1 columns are left as-is.
 *
 * Deploy: supabase functions deploy compute-user-embeddings --no-verify-jwt
 * Trigger: pg_cron schedule from migration 20260428000300_compute_embeddings_cron.sql
 *
 * Body params (optional, used for backfill):
 *   { force?: boolean, batch?: number, user_ids?: string[] }
 *   - force=true: ignores signals_updated_at, recomputes everyone
 *   - user_ids: restrict to this set (one-shot backfill of specific users)
 *   - batch: max users to process per invocation (default 50)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_INTERVAL_DAYS = 7;
const DEFAULT_BATCH_SIZE = 50;

type ProfileRow = {
  id: string;
  bio: string | null;
  display_name: string | null;
  work: string | null;
  education: string | null;
  hometown: string | null;
  looking_for: string | null;
  dating_intention: string | null;
  dating_intention_extra: string | null;
  relationship_type: string | null;
  relationship_type_extra: string | null;
  religion: string | null;
  politics: string | null;
};

type RequestBody = {
  force?: boolean;
  batch?: number;
  user_ids?: string[];
};

type Outcome = {
  user_id: string;
  status: "ok" | "skipped_no_text" | "embed_failed" | "upsert_failed";
  bio_embedded: boolean;
  answers_embedded: boolean;
  error?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const body: RequestBody = await req.json().catch(() => ({}));
  const force = body.force ?? false;
  const batchSize = Math.min(body.batch ?? DEFAULT_BATCH_SIZE, 200);
  const explicitUserIds = body.user_ids;

  try {
    const userIds = explicitUserIds && explicitUserIds.length > 0
      ? explicitUserIds
      : await selectStaleUsers(supabase, batchSize, force);

    if (userIds.length === 0) {
      return jsonResponse({ processed: 0, message: "no stale users" });
    }

    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select(
        "id, bio, display_name, work, education, hometown, looking_for, dating_intention, dating_intention_extra, relationship_type, relationship_type_extra, religion, politics",
      )
      .in("id", userIds);

    if (profileErr) throw profileErr;

    const outcomes: Outcome[] = [];
    for (const profile of (profiles ?? []) as ProfileRow[]) {
      outcomes.push(await processProfile(supabase, profile));
    }

    return jsonResponse({
      processed: outcomes.length,
      ok: outcomes.filter((o) => o.status === "ok").length,
      skipped: outcomes.filter((o) => o.status === "skipped_no_text").length,
      failed: outcomes.filter((o) => o.status !== "ok" && o.status !== "skipped_no_text").length,
      outcomes,
    });
  } catch (err) {
    console.error("[compute-user-embeddings] crashed:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

async function selectStaleUsers(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  batchSize: number,
  force: boolean,
): Promise<string[]> {
  // Two queries because Supabase JS doesn't compose left-anti-join cleanly.
  // Fine at small scale; add a SECURITY DEFINER helper RPC if user_count > 10k.
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id");
  if (pErr) throw pErr;

  const { data: signals, error: sErr } = await supabase
    .from("user_signals")
    .select("user_id, signals_updated_at");
  if (sErr) throw sErr;

  const signalByUser = new Map<string, string>();
  for (const row of (signals ?? []) as { user_id: string; signals_updated_at: string }[]) {
    signalByUser.set(row.user_id, row.signals_updated_at);
  }

  const staleCutoff = Date.now() - STALE_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
  const candidates: string[] = [];
  for (const p of (profiles ?? []) as { id: string }[]) {
    const updatedAt = signalByUser.get(p.id);
    if (force || !updatedAt || new Date(updatedAt).getTime() < staleCutoff) {
      candidates.push(p.id);
      if (candidates.length >= batchSize) break;
    }
  }
  return candidates;
}

async function processProfile(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  profile: ProfileRow,
): Promise<Outcome> {
  const bioText = (profile.bio ?? "").trim();
  const answersText = buildAnswersText(profile);

  if (!bioText && !answersText) {
    return {
      user_id: profile.id,
      status: "skipped_no_text",
      bio_embedded: false,
      answers_embedded: false,
    };
  }

  const [bioResult, answersResult] = await Promise.all([
    bioText ? embed(bioText) : Promise.resolve(null),
    answersText ? embed(answersText) : Promise.resolve(null),
  ]);

  const bioOk = bioResult !== null && isEmbedSuccess(bioResult);
  const answersOk = answersResult !== null && isEmbedSuccess(answersResult);

  if (bioText && !bioOk) {
    return {
      user_id: profile.id,
      status: "embed_failed",
      bio_embedded: false,
      answers_embedded: answersOk,
      error: `bio: ${JSON.stringify(bioResult)}`,
    };
  }
  if (answersText && !answersOk) {
    return {
      user_id: profile.id,
      status: "embed_failed",
      bio_embedded: bioOk,
      answers_embedded: false,
      error: `answers: ${JSON.stringify(answersResult)}`,
    };
  }

  const upsertRow: Record<string, unknown> = {
    user_id: profile.id,
    signals_updated_at: new Date().toISOString(),
  };
  if (bioOk) upsertRow.bio_embedding = toPgVector((bioResult as { vector: number[] }).vector);
  if (answersOk) upsertRow.answers_embedding = toPgVector((answersResult as { vector: number[] }).vector);

  const { error: upsertErr } = await supabase
    .from("user_signals")
    .upsert(upsertRow, { onConflict: "user_id" });

  if (upsertErr) {
    return {
      user_id: profile.id,
      status: "upsert_failed",
      bio_embedded: bioOk,
      answers_embedded: answersOk,
      error: upsertErr.message,
    };
  }

  return {
    user_id: profile.id,
    status: "ok",
    bio_embedded: bioOk,
    answers_embedded: answersOk,
  };
}

function buildAnswersText(p: ProfileRow): string {
  const parts: string[] = [];
  if (p.work) parts.push(`Work: ${p.work}`);
  if (p.education) parts.push(`Education: ${p.education}`);
  if (p.hometown) parts.push(`From: ${p.hometown}`);
  if (p.looking_for) parts.push(`Looking for: ${p.looking_for}`);
  if (p.dating_intention) {
    const extra = p.dating_intention_extra ? ` (${p.dating_intention_extra})` : "";
    parts.push(`Intention: ${p.dating_intention}${extra}`);
  }
  if (p.relationship_type) {
    const extra = p.relationship_type_extra ? ` (${p.relationship_type_extra})` : "";
    parts.push(`Relationship type: ${p.relationship_type}${extra}`);
  }
  if (p.religion) parts.push(`Religion: ${p.religion}`);
  if (p.politics) parts.push(`Politics: ${p.politics}`);
  return parts.join("\n");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
