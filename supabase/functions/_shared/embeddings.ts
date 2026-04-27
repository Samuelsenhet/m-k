/**
 * Embeddings provider abstraction for Monster Match v1 synthesis layer.
 *
 * Used by `compute-user-embeddings` (and future `generate-match-pools` when
 * embedding similarity enters the composite score) to turn free text into
 * 1536-dim vectors that match user_signals.{bio_embedding, answers_embedding}.
 *
 * Provider selected via `EMBEDDING_PROVIDER` env. Default: openai
 * (text-embedding-3-small, 1536 dims). Anthropic does not have a native
 * embeddings API, so we keep this separate from _shared/llm.ts.
 *
 * Failure path: 1 retry → null. Caller writes null to user_signals and bumps
 * signals_updated_at, so the next cron run picks it up again.
 */

const OPENAI_MODEL = "text-embedding-3-small";
const OPENAI_DIMENSIONS = 1536;

export type EmbedResult = {
  vector: number[];
  provider: string;
  latency_ms: number;
};

export type EmbedFailure = {
  reason: string;
  http_status?: number;
  body_excerpt?: string;
};

export async function embed(text: string): Promise<EmbedResult | EmbedFailure> {
  const provider = (Deno.env.get("EMBEDDING_PROVIDER") ?? "openai").toLowerCase();
  const start = Date.now();

  if (provider === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return { reason: "OPENAI_API_KEY missing" };
    }
    const result = await tryOpenAI(text, apiKey);
    if ("vector" in result) {
      return { vector: result.vector, provider: "openai", latency_ms: Date.now() - start };
    }
    return result;
  }

  return { reason: `unknown provider: ${provider}` };
}

export function isEmbedSuccess(r: EmbedResult | EmbedFailure): r is EmbedResult {
  return "vector" in r;
}

async function tryOpenAI(
  text: string,
  apiKey: string,
): Promise<{ vector: number[] } | EmbedFailure> {
  let lastFailure: EmbedFailure = { reason: "unknown" };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          input: text,
          dimensions: OPENAI_DIMENSIONS,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        lastFailure = {
          reason: `openai http ${response.status}`,
          http_status: response.status,
          body_excerpt: bodyText.slice(0, 200),
        };
        console.warn(`[embeddings] openai attempt ${attempt + 1}:`, lastFailure);
        continue;
      }

      const json = await response.json();
      const vector = json?.data?.[0]?.embedding;
      if (Array.isArray(vector) && vector.length === OPENAI_DIMENSIONS) {
        return { vector };
      }
      lastFailure = { reason: "unexpected openai response shape" };
    } catch (err) {
      lastFailure = { reason: `openai crashed: ${err}` };
      console.warn(`[embeddings] openai attempt ${attempt + 1}:`, lastFailure);
    }
  }
  return lastFailure;
}

/**
 * pgvector wants vectors as `[0.1,0.2,...]` literal strings when sending via
 * the JS client (or as native Float32 if you go through pgmq). Use this when
 * doing supabase.from("user_signals").upsert({ bio_embedding: toPgVector(v) }).
 */
export function toPgVector(v: number[]): string {
  return `[${v.join(",")}]`;
}
