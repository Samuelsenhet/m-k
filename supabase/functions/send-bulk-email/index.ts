import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Server not configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { campaign_id: campaignId } = await req.json();
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "Missing campaign_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: campaign, error: campaignError } = await admin
      .from("bulk_emails")
      .select("id, name, template_id, filters, status")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return new Response(
        JSON.stringify({ error: "Campaign already sent or cancelled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let templateName = campaign.name;
    if (campaign.template_id) {
      const { data: tmpl } = await admin
        .from("email_templates")
        .select("name")
        .eq("id", campaign.template_id)
        .single();
      if (tmpl?.name) templateName = tmpl.name;
    }

    await admin
      .from("bulk_emails")
      .update({ status: "sending" })
      .eq("id", campaignId);

    const filters = (campaign.filters as Record<string, unknown>) || {};
    let profilesQuery = admin.from("profiles").select("id, display_name");
    if (filters.country && typeof filters.country === "string") {
      profilesQuery = profilesQuery.eq("country", filters.country);
    }
    const { data: profiles } = await profilesQuery;
    const userIds = (profiles ?? []).map((p: { id: string }) => p.id);
    const displayNames: Record<string, string> = {};
    (profiles ?? []).forEach((p: { id: string; display_name?: string }) => {
      displayNames[p.id] = p.display_name || "användare";
    });

    const results: { email: string; success: boolean; error?: string }[] = [];
    for (const userId of userIds) {
      const { data: { user } } = await admin.auth.getUserById(userId);
      const email = user?.email?.trim();
      if (!email || email.endsWith("@phone.maak.app")) {
        results.push({ email: email || "(no email)", success: false, error: "no_valid_email" });
        continue;
      }
      try {
        const invokeRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email,
            template: templateName,
            data: { user_name: displayNames[userId] || "användare" },
            language: "sv",
          }),
        });
        const invokeData = await invokeRes.json();
        if (invokeRes.ok && invokeData.success && !invokeData.skipped) {
          results.push({ email, success: true });
        } else {
          results.push({
            email,
            success: false,
            error: invokeData.error || (invokeData.skipped ? "skipped" : "unknown"),
          });
        }
      } catch (e) {
        results.push({
          email,
          success: false,
          error: e instanceof Error ? e.message : "send failed",
        });
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    await admin
      .from("bulk_emails")
      .update({
        status: "completed",
        sent_at: new Date().toISOString(),
        results,
      })
      .eq("id", campaignId);

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: results.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-bulk-email error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
