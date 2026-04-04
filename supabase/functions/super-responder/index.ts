import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { verifySupabaseJWT } from "../_shared/env.ts";

interface reqPayload {
  name: string;
}

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const userId = await verifySupabaseJWT(req.headers.get("Authorization") || "");
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: reqPayload;
  try {
    body = (await req.json()) as reqPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const name = body?.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Missing or invalid name (non-empty string required)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = {
    message: `Hello ${name.trim()}!`,
  };

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json", Connection: "keep-alive" },
  });
});
