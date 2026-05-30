# @voxell/forge-ai-provider

A [Vercel AI SDK](https://ai-sdk.dev) community provider for **Forge** — Voxell's hosted
text-embedding API. Use Forge with `embed` / `embedMany` like any other AI SDK provider.

## Why Forge

- **Quality you can dial.** Forge runs the Qwen3-Embedding family; `ultra` is the **8B — ~75+
  average task score on MTEB, currently #4 on MTEB (English)**, and the top *usable* model (the
  three ranked above it are research-only). `turbo` (0.6B) is the fast/cheap tier — pick your
  point on the quality/cost curve.
- **Matryoshka (MRL).** Truncate to fewer dimensions (re-normalized) for ~4× smaller, cheaper
  vectors — one option, minimal quality loss.
- **Low latency.** Served by a Go + CUDA engine; HTTP and gRPC.
- **Zero-trust.** Per-key auth; mTLS available.
- **Start free.** 10M tokens, no card — [dash.voxell.ai](https://dash.voxell.ai). Learn more:
  [voxell.ai/forge](https://voxell.ai/forge).

## Install

```bash
npm i @voxell/forge-ai-provider ai
```

## Use

```ts
import { embed, embedMany } from "ai";
import { forge } from "@voxell/forge-ai-provider"; // API key from FORGE_API_KEY

const { embedding } = await embed({
  model: forge.textEmbeddingModel("turbo"),
  value: "hello world",
});

const { embeddings } = await embedMany({
  model: forge("pro"),            // shorthand for textEmbeddingModel
  values: ["doc one", "doc two"],
});

// Matryoshka — smaller, cheaper vectors (re-normalized server-side)
await embed({
  model: forge("turbo"),
  value: query,
  providerOptions: { forge: { dimensions: 256 } },
});

// Retrieval: mark queries vs documents
await embed({
  model: forge("turbo"),
  value: query,
  providerOptions: { forge: { inputType: "query" } }, // default is "document"
});
```

## Models

| id | dimensions | notes |
|----|-----------|-------|
| `turbo` | 1024 | fast, low cost — **default** |
| `pro` | 2560 | |
| `ultra` | 4096 | Qwen3-Embedding-8B; ~75+ avg MTEB, #4 (English), top *usable* model |

## Configuration

```ts
import { createForge } from "@voxell/forge-ai-provider";
const forge = createForge({
  apiKey: process.env.FORGE_API_KEY, // default
  baseURL: "https://api.voxell.ai",  // default
  headers: {},
  // fetch: customFetch,
});
```

`providerOptions.forge`: `dimensions` (Matryoshka truncation) · `inputType` (`"query"` | `"document"`).

## License

MIT © Voxell, Inc.
