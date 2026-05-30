// Vercel AI SDK community provider for Forge (Voxell's text-embedding API).
// Implements EmbeddingModelV3 (AI SDK v6 / @ai-sdk/provider v3). Wraps POST /v1/embed.
import type {
  EmbeddingModelV3,
  EmbeddingModelV3CallOptions,
  EmbeddingModelV3Result,
} from "@ai-sdk/provider";

export interface ForgeProviderSettings {
  /** Forge API key. Defaults to the FORGE_API_KEY env var. */
  apiKey?: string;
  /** API base URL. Defaults to https://api.voxell.ai */
  baseURL?: string;
  /** Extra headers to send with every request. */
  headers?: Record<string, string>;
  /** Custom fetch implementation (testing/proxies). */
  fetch?: typeof fetch;
  /** Max texts per /v1/embed call. Default 256. */
  maxEmbeddingsPerCall?: number;
}

/** Per-call options, passed via `providerOptions.forge`. */
export interface ForgeEmbeddingOptions {
  /** Matryoshka truncation: target dimension (Forge re-normalizes server-side). */
  dimensions?: number;
  /** "query" applies a retrieval prefix; "document" is raw. Default "document". */
  inputType?: "query" | "document";
}

const clean = (h: Record<string, string | undefined> | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h ?? {})) if (v != null) out[k] = v;
  return out;
};

class ForgeEmbeddingModel implements EmbeddingModelV3 {
  readonly specificationVersion = "v3" as const;
  readonly provider = "forge.embedding";
  readonly modelId: string;
  readonly maxEmbeddingsPerCall: number;
  readonly supportsParallelCalls = true;

  constructor(
    modelId: string,
    private readonly cfg: {
      baseURL: string;
      headers: () => Record<string, string | undefined>;
      fetch: typeof fetch;
      maxEmbeddingsPerCall: number;
    },
  ) {
    this.modelId = modelId;
    this.maxEmbeddingsPerCall = cfg.maxEmbeddingsPerCall;
  }

  async doEmbed({
    values,
    headers,
    abortSignal,
    providerOptions,
  }: EmbeddingModelV3CallOptions): Promise<EmbeddingModelV3Result> {
    const opts = (providerOptions?.forge ?? {}) as ForgeEmbeddingOptions;
    const body: Record<string, unknown> = {
      texts: values, // Forge's public edge requires `texts` (array), not `input`
      model: this.modelId,
      input_type: opts.inputType ?? "document",
    };
    if (typeof opts.dimensions === "number" && opts.dimensions > 0) body.dim = opts.dimensions;

    const res = await this.cfg.fetch(`${this.cfg.baseURL}/v1/embed`, {
      method: "POST",
      headers: { "content-type": "application/json", ...clean(this.cfg.headers()), ...clean(headers) },
      body: JSON.stringify(body),
      signal: abortSignal,
    });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = (await res.json()) as { error?: string };
        if (j?.error) msg = j.error;
      } catch {
        /* non-JSON error body */
      }
      throw new Error(`Forge embeddings: HTTP ${res.status} ${msg}`);
    }
    const json = (await res.json()) as { embeddings: number[][]; tokens?: number };
    if (!Array.isArray(json.embeddings)) {
      throw new Error("Forge embeddings: malformed response (no embeddings)");
    }
    // `warnings` is required by EmbeddingModelV3Result (the SDK iterates it); we have none.
    return { embeddings: json.embeddings, usage: { tokens: json.tokens ?? 0 }, warnings: [] };
  }
}

export interface ForgeProvider {
  /** Call as a function for the default model (turbo). */
  (modelId?: string): ForgeEmbeddingModel;
  /** Text embedding model accessor (AI SDK convention). */
  textEmbeddingModel(modelId: string): ForgeEmbeddingModel;
  /** Alias for textEmbeddingModel. */
  embedding(modelId: string): ForgeEmbeddingModel;
}

export function createForge(settings: ForgeProviderSettings = {}): ForgeProvider {
  const baseURL = (settings.baseURL ?? "https://api.voxell.ai").replace(/\/+$/, "");
  const maxEmbeddingsPerCall = settings.maxEmbeddingsPerCall ?? 256;
  const headers = (): Record<string, string | undefined> => {
    const apiKey =
      settings.apiKey ?? (typeof process !== "undefined" ? process.env.FORGE_API_KEY : undefined);
    return { authorization: apiKey ? `Bearer ${apiKey}` : undefined, ...settings.headers };
  };
  const fetchImpl = settings.fetch ?? fetch;
  const create = (modelId: string) =>
    new ForgeEmbeddingModel(modelId, { baseURL, headers, fetch: fetchImpl, maxEmbeddingsPerCall });

  const provider = ((modelId = "turbo") => create(modelId)) as ForgeProvider;
  provider.textEmbeddingModel = create;
  provider.embedding = create;
  return provider;
}

/** Default Forge provider instance. API key from FORGE_API_KEY. */
export const forge: ForgeProvider = createForge();
