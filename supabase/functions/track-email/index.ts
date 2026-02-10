import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const PIXEL_BASE64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const logId = url.searchParams.get("log_id");
    const type = url.searchParams.get("type") || "open";

    if (!logId) {
      return new Response("Missing log_id", { status: 400 });
    }

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const updateData =
        type === "click"
          ? { clicked_at: new Date().toISOString() }
          : { opened_at: new Date().toISOString() };

      await admin.from("email_logs").update(updateData).eq("id", logId);
    }

    const pixel = Uint8Array.from(atob(PIXEL_BASE64), (c) => c.charCodeAt(0));
    return new Response(pixel, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
      },
    });
  } catch (err) {
    console.error("track-email error:", err);
    return new Response("Error", { status: 500 });
  }
});
