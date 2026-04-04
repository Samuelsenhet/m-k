import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/env.ts";

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userId = await verifySupabaseJWT(authHeader);

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    let payload: NotificationPayload;
    try {
      payload = await req.json() as NotificationPayload;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.user_id || !payload.title || !payload.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data, error: dbError } = await supabaseClient
      .from("notifications")
      .insert({
        user_id: payload.user_id,
        title: payload.title,
        message: payload.message,
        type: payload.type || "info",
        sent_by: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    const channel = supabaseClient.channel(`user:${payload.user_id}:notifications`);

    try {
      try {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("Realtime subscribe timeout")), 15_000);
          channel.subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              clearTimeout(t);
              resolve();
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              clearTimeout(t);
              reject(err ?? new Error(`Realtime subscribe failed: ${status}`));
            }
          });
        });

        const sendRes = await channel.send({
          type: "broadcast",
          event: "notification_received",
          payload: data,
        });
        if (sendRes !== "ok" && sendRes !== "queued") {
          console.warn("send-notification: channel.send status", sendRes);
        }
      } catch (rtErr) {
        console.warn("send-notification: realtime subscribe/send failed (best-effort)", rtErr);
      }
    } finally {
      await supabaseClient.removeChannel(channel);
    }

    return new Response(JSON.stringify({ success: true, notification: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending notification:", error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
