/**
 * Inserts a system message into a collection (type = 'system', sender_id = null).
 * Uses service role so RLS is bypassed; client cannot insert system messages.
 * Caller must be authenticated and (for member_added) an owner of the collection.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EventType = "member_added" | "member_left";

interface Body {
  collection_id: string;
  event: EventType;
  display_name: string;
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { collection_id, event, display_name } = body;

  if (
    !collection_id ||
    typeof collection_id !== "string" ||
    !event ||
    !["member_added", "member_left"].includes(event) ||
    !display_name ||
    typeof display_name !== "string"
  ) {
    return new Response(
      JSON.stringify({
        error: "Bad request: collection_id, event (member_added | member_left), and display_name required",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Sanitize display_name for display (max length, no control chars)
  // eslint-disable-next-line no-control-regex -- intentional: strip control characters
  const safeName = display_name.slice(0, 100).replace(/[\x00-\x1f]/g, "").trim() || "Användare";

  if (event === "member_added") {
    const { data: membership } = await authClient
      .from("collection_members")
      .select("role")
      .eq("collection_id", collection_id)
      .eq("user_id", user.id)
      .is("left_at", null)
      .maybeSingle();

    if (!membership || membership.role !== "owner") {
      return new Response(JSON.stringify({ error: "Forbidden: only owner can add members" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  // For member_left: caller is the one leaving; no extra check (they were a member by definition)

  const content =
    event === "member_left"
      ? `${safeName} lämnade gruppen.`
      : `${safeName} lades till i gruppen.`;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { error: insertError } = await admin.from("collection_messages").insert({
    collection_id,
    sender_id: null,
    type: "system",
    content,
  });

  if (insertError) {
    console.error("collection-system-message insert error:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to insert system message" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
