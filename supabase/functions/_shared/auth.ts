// JWT Verification Helper for Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration");
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { user, supabaseClient };
}
