/// <reference types="https://deno.land/x/types/index.d.ts" />
/**
 * waitlist-notify — admin-gated batch email sender for the /vanta/ waitlist.
 *
 * Usage:
 *   curl -X POST https://.../functions/v1/waitlist-notify \
 *     -H "Authorization: Bearer $WAITLIST_ADMIN_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{ "subject": "...", "html": "...", "dry_run": false }'
 *
 * Behavior:
 *   - Auth: custom Bearer secret from WAITLIST_ADMIN_SECRET env var (NOT a user JWT)
 *   - Queries waitlist_signups WHERE notified_at IS NULL AND source = 'landing_vanta'
 *   - For each row, sends via Resend API directly, then sets notified_at = now()
 *   - Rate-limited to 8 sends/sec to stay under Resend's 10/sec free tier ceiling
 *   - dry_run: true returns the recipients without sending
 *   - Returns { sent, failed, skipped, total }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SOURCE = "landing_vanta";
const SEND_DELAY_MS = 130; // ~7.7/sec

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const DEFAULT_SUBJECT = "MÄÄK finns nu i App Store 🎉";
const DEFAULT_HTML = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #253D2C;">
  <h1 style="font-size: 28px; margin: 0 0 16px; color: #4B6E48;">Det är dags.</h1>
  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
    Tack för att du skrev upp dig på väntelistan. MÄÄK finns nu i App Store — dags att hitta någon som passar dig på riktigt.
  </p>
  <p style="margin: 24px 0;">
    <a href="https://apps.apple.com/app/maak" style="display: inline-block; background: linear-gradient(to right, #4B6E48, #5FA886); color: white; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600;">Ladda ner MÄÄK</a>
  </p>
  <p style="font-size: 14px; color: #6B6B6B; line-height: 1.5; margin: 24px 0 0;">
    Vi matchar dig på personlighet — inte bara utseende. Välkommen till något lite lugnare.
  </p>
  <hr style="border: none; border-top: 1px solid #E8E4E0; margin: 32px 0 16px;" />
  <p style="font-size: 12px; color: #8B8B8B;">
    Du får det här mejlet för att du skrev upp dig på <a href="https://maakapp.se/vanta/" style="color: #4B6E48;">maakapp.se/vanta/</a>. Tack för tålamodet.
  </p>
</div>
`.trim();

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const ADMIN_SECRET = Deno.env.get("WAITLIST_ADMIN_SECRET") ?? "";
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const FROM_EMAIL = Deno.env.get("MAIL_FROM") ?? "MÄÄK <no-reply@maakapp.se>";

  if (!ADMIN_SECRET || !RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured" }, 503);
  }

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== ADMIN_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const subject: string = typeof body?.subject === "string" && body.subject ? body.subject : DEFAULT_SUBJECT;
  const html: string = typeof body?.html === "string" && body.html ? body.html : DEFAULT_HTML;
  const dryRun: boolean = body?.dry_run === true;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: recipients, error: loadError } = await supabase
    .from("waitlist_signups")
    .select("id, email")
    .eq("source", SOURCE)
    .is("notified_at", null)
    .order("created_at", { ascending: true });

  if (loadError) {
    console.error("[waitlist-notify] load error:", loadError);
    return json({ error: "Failed to load recipients" }, 500);
  }

  const total = recipients?.length ?? 0;

  if (dryRun) {
    return json({
      dry_run: true,
      total,
      recipients: recipients?.map((r: { email: string }) => r.email) ?? [],
      subject,
    }, 200);
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const r of recipients ?? []) {
    const row = r as { id: string; email: string };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: row.email,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        failed++;
        errors.push(`${row.email}: ${res.status} ${errText.slice(0, 200)}`);
        console.error(`[waitlist-notify] Resend failed for ${row.email}:`, res.status, errText);
        continue;
      }

      await supabase
        .from("waitlist_signups")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", row.id);

      sent++;
    } catch (err) {
      failed++;
      errors.push(`${row.email}: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`[waitlist-notify] send error for ${row.email}:`, err);
    }

    await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
  }

  return json(
    {
      total,
      sent,
      failed,
      skipped: total - sent - failed,
      errors: errors.slice(0, 20),
    },
    200,
  );
});
