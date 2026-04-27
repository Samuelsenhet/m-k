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

export async function embed(text: string): Promise<EmbedResult | null> {
  const provider = (Deno.env.get("EMBEDDING_PROVIDER") ?? "openai").toLowerCase();
  const start = Date.now();

  if (provider === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.warn("[embeddings] OPENAI_API_KEY missing");
      return null;
    }
    const vector = await tryOpenAI(text, apiKey);
    if (vector) {
      return { vector, provider: "openai", latency_ms: Date.now() - start };
    }
  } else {
    console.warn(`[embeddings] unknown provider: ${provider}`);
  }

  return null;
}

async function tryOpenAI(text: string, apiKey: string): Promise<number[] | null> {
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
        console.warn(
          `[embeddings] openai attempt ${attempt + 1} failed:`,
          response.status,
        );
        continue;
      }

      const json = await response.json();
      const vector = json?.data?.[0]?.embedding;
      if (Array.isArray(vector) && vector.length === OPENAI_DIMENSIONS) {
        return vector;
      }
      console.warn(`[embeddings] openai attempt ${attempt + 1}: unexpected response shape`);
    } catch (err) {
      console.warn(`[embeddings] openai attempt ${attempt + 1} crashed:`, err);
    }
  }
  return null;
}

/**
 * pgvector wants vectors as `[0.1,0.2,...]` literal strings when sending via
 * the JS client (or as native Float32 if you go through pgmq). Use this when
 * doing supabase.from("user_signals").upsert({ bio_embedding: toPgVector(v) }).
 */
export function toPgVector(v: number[]): string {
  return `[${v.join(",")}]`;
}
