import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const FROM_EMAIL = Deno.env.get("MAIL_FROM") ?? "Määk <no-reply@maakapp.se>";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type InlineTemplateName = "report_received" | "report_resolved" | "appeal_received" | "appeal_decision";

interface SendEmailPayload {
  to?: string;
  template: string;
  data?: Record<string, string>;
  language?: "sv" | "en";
}

const INLINE_TEMPLATES: Record<
  InlineTemplateName,
  { sv: { subject: string; body: string }; en: { subject: string; body: string } }
> = {
  report_received: {
    sv: {
      subject: "Din rapport har mottagits – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Tack för din rapport</h2><p>Vi har mottagit din säkerhetsrapport.</p><p>Vi granskar den och återkommer inom 24–72 timmar.</p><p>Referens: {{report_id}}</p><hr><small>Määk Safety Team</small></div>`,
    },
    en: {
      subject: "Your report has been received – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Thank you for your report</h2><p>We have received your safety report.</p><p>We will review it and get back to you within 24–72 hours.</p><p>Reference: {{report_id}}</p><hr><small>Määk Safety Team</small></div>`,
    },
  },
  report_resolved: {
    sv: {
      subject: "Din rapport har hanterats – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Rapport avslutad</h2><p>Din rapport har granskats och avslutats.</p><p>Status: {{status}}</p><hr><small>Määk Safety Team</small></div>`,
    },
    en: {
      subject: "Your report has been resolved – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Report resolved</h2><p>Your report has been reviewed and closed.</p><p>Status: {{status}}</p><hr><small>Määk Safety Team</small></div>`,
    },
  },
  appeal_received: {
    sv: {
      subject: "Ditt överklagande har mottagits – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Tack för ditt överklagande</h2><p>Vi har mottagit ditt ärende.</p><p>Vi granskar det och återkommer inom 72 timmar.</p><p>Referens: {{appeal_id}}</p><hr><small>Määk Team</small></div>`,
    },
    en: {
      subject: "Your appeal has been received – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Thank you for your appeal</h2><p>We have received your case.</p><p>We will review it and get back to you within 72 hours.</p><p>Reference: {{appeal_id}}</p><hr><small>Määk Team</small></div>`,
    },
  },
  appeal_decision: {
    sv: {
      subject: "Beslut på ditt överklagande – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Beslut</h2><p>Ditt överklagande har behandlats.</p><p>Resultat: {{status}}</p><hr><small>Määk Team</small></div>`,
    },
    en: {
      subject: "Decision on your appeal – Määk",
      body: `<div style="font-family: sans-serif; padding: 20px;"><h2 style="color: #ec4899;">Decision</h2><p>Your appeal has been processed.</p><p>Outcome: {{status}}</p><hr><small>Määk Team</small></div>`,
    },
  },
};

function replacePlaceholders(text: string, data?: Record<string, string>): string {
  if (!data) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? `{{${key}}}`));
}

function injectTrackingPixel(html: string, logId: string): string {
  if (!SUPABASE_URL || !logId) return html;
  const trackUrl = `${SUPABASE_URL}/functions/v1/track-email?log_id=${logId}`;
  const pixel = `<img src="${trackUrl}" width="1" height="1" style="display:none;" alt="" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return html + pixel;
}

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

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: SendEmailPayload = await req.json();
    const { to: toParam, template, data = {}, language = "sv" } = payload;

    if (!template || typeof template !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required field: template" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    let to = toParam?.trim();
    if (!to && admin) {
      if (template === "report_resolved" && data.report_id) {
        const { data: report } = await admin.from("reports").select("reporter_id").eq("id", data.report_id).single();
        if (report?.reporter_id) {
          const { data: { user: reporter } } = await admin.auth.getUserById(report.reporter_id);
          to = reporter?.email?.trim() ?? "";
        }
      } else if (template === "appeal_decision" && data.appeal_id) {
        const { data: appeal } = await admin.from("appeals").select("user_id").eq("id", data.appeal_id).single();
        if (appeal?.user_id) {
          const { data: { user: appellant } } = await admin.auth.getUserById(appeal.user_id);
          to = appellant?.email?.trim() ?? "";
        }
      }
    }

    const isPlaceholderEmail = !to || to.endsWith("@phone.maak.app");
    if (!to || isPlaceholderEmail) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "no_email_or_placeholder" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language === "en" ? "en" : "sv";
    const dataStr: Record<string, string> = { ...data };

    let subject: string;
    let html: string;
    let templateId: string | null = null;

    if (admin) {
      const { data: dbTemplate } = await admin
        .from("email_templates")
        .select("id, subject_sv, subject_en, body_sv, body_en")
        .eq("name", template)
        .single();

      if (dbTemplate) {
        subject = replacePlaceholders(lang === "en" ? (dbTemplate.subject_en || dbTemplate.subject_sv) : dbTemplate.subject_sv, dataStr);
        const body = lang === "en" ? (dbTemplate.body_en || dbTemplate.body_sv) : dbTemplate.body_sv;
        html = replacePlaceholders(body || "", dataStr);
        templateId = dbTemplate.id;
        await admin
          .from("email_templates")
          .update({ last_used: new Date().toISOString() })
          .eq("id", dbTemplate.id);
      } else {
        const inlineName = template as InlineTemplateName;
        const inline = INLINE_TEMPLATES[inlineName];
        if (!inline) {
          return new Response(
            JSON.stringify({ error: "Invalid template (not in DB and not a built-in template)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = replacePlaceholders(inline[lang].subject, dataStr);
        html = replacePlaceholders(inline[lang].body, dataStr);
      }
    } else {
      const inlineName = template as InlineTemplateName;
      const inline = INLINE_TEMPLATES[inlineName];
      if (!inline) {
        return new Response(
          JSON.stringify({ error: "Invalid template" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      subject = replacePlaceholders(inline[lang].subject, dataStr);
      html = replacePlaceholders(inline[lang].body, dataStr);
    }

    let logId: string | null = null;
    if (admin) {
      const { data: logRow } = await admin
        .from("email_logs")
        .insert({
          recipient_email: to,
          subject,
          template_name: template,
          template_id: templateId,
          status: "pending",
          report_id: data.report_id ?? null,
          appeal_id: data.appeal_id ?? null,
        })
        .select("id")
        .single();
      logId = logRow?.id ?? null;
    }

    const htmlToSend = logId ? injectTrackingPixel(html, logId) : html;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html: htmlToSend,
      }),
    });

    const resData = await res.json();
    const logStatus = res.ok ? "sent" : "failed";
    const errorMessage = res.ok ? null : (resData?.message ?? JSON.stringify(resData));

    if (admin && logId) {
      await admin
        .from("email_logs")
        .update({ status: logStatus, error_message: errorMessage })
        .eq("id", logId);
      if (res.ok && data.report_id) {
        await admin.from("reports").update({ email_sent: true }).eq("id", data.report_id);
      }
      if (res.ok && data.appeal_id) {
        await admin.from("appeals").update({ email_sent: true }).eq("id", data.appeal_id);
      }
    }

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resData?.id, log_id: logId ?? undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
