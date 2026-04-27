// Generic storage proxy for buckets where direct client writes are
// unreliable on this project's storage-api (platform bug: INSERT returns
// 403 RLS despite correct policies — see incident 2026-04-18, profile-photos).
//
// Supported actions:
//   - upload: write base64 body to <bucket>/<path>
//   - remove: delete a list of object paths in <bucket>
//
// Auth: Bearer JWT required. User id is extracted and every path is
// required to start with "<user.id>/". Buckets are whitelisted.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { verifyAuth } from "../_shared/auth.ts";

const ALLOWED_BUCKETS: Record<string, { maxBytes: number; contentTypes: Set<string> }> = {
  "profile-photos": {
    maxBytes: 52_428_800, // 50 MB
    contentTypes: new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ]),
  },
  "report-evidence": {
    maxBytes: 10_485_760, // 10 MB
    contentTypes: new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]),
  },
};

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req, "POST, OPTIONS");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  let user: { id: string };
  try {
    ({ user } = await verifyAuth(req));
  } catch {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  const body = await req.json().catch(() => null) as
    | {
        action?: "upload" | "remove";
        bucket?: string;
        path?: string;
        paths?: string[];
        contentType?: string;
        base64?: string;
      }
    | null;
  if (!body?.action || !body.bucket) {
    return json({ error: "Missing action or bucket" }, 400, cors);
  }
  const bucketConfig = ALLOWED_BUCKETS[body.bucket];
  if (!bucketConfig) {
    return json({ error: `Bucket not allowed: ${body.bucket}` }, 400, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server misconfigured" }, 500, cors);
  }
  const admin = createClient(supabaseUrl, serviceKey);

  // Every path sent by the client must be prefixed with "<user.id>/" — we
  // never trust the client's id and never let it write into another user's
  // folder even if the JWT is valid.
  const checkPathPrefix = (p: string): string | null => {
    const first = p.split("/")[0];
    if (first !== user.id) return `Path prefix does not match authenticated user: ${p}`;
    return null;
  };

  if (body.action === "upload") {
    if (!body.path || !body.contentType || !body.base64) {
      return json({ error: "Missing path, contentType, or base64" }, 400, cors);
    }
    const prefixErr = checkPathPrefix(body.path);
    if (prefixErr) return json({ error: prefixErr }, 403, cors);
    if (!bucketConfig.contentTypes.has(body.contentType)) {
      return json(
        { error: `Disallowed content type for ${body.bucket}: ${body.contentType}` },
        400,
        cors,
      );
    }
    const bytes = base64ToBytes(body.base64);
    if (bytes.byteLength === 0 || bytes.byteLength > bucketConfig.maxBytes) {
      return json({ error: `Invalid byte length: ${bytes.byteLength}` }, 400, cors);
    }
    const { error: upErr } = await admin.storage
      .from(body.bucket)
      .upload(body.path, bytes, {
        contentType: body.contentType,
        upsert: true,
        cacheControl: "3600",
      });
    if (upErr) {
      return json({ error: `Storage upload failed: ${upErr.message}` }, 502, cors);
    }
    return json({ path: body.path }, 200, cors);
  }

  if (body.action === "remove") {
    if (!Array.isArray(body.paths) || body.paths.length === 0) {
      return json({ error: "Missing paths" }, 400, cors);
    }
    for (const p of body.paths) {
      const prefixErr = checkPathPrefix(p);
      if (prefixErr) return json({ error: prefixErr }, 403, cors);
    }
    const { error: rmErr } = await admin.storage.from(body.bucket).remove(body.paths);
    if (rmErr) {
      return json({ error: `Storage remove failed: ${rmErr.message}` }, 502, cors);
    }
    return json({ removed: body.paths }, 200, cors);
  }

  return json({ error: `Unknown action: ${body.action}` }, 400, cors);
});
