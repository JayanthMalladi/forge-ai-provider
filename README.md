# @voxell/forge-ai-provider

A [Vercel AI SDK](https://ai-sdk.dev) community provider for **Forge** — Voxell's hosted
text-embedding API. Use Forge with `embed` / `embedMany` like any other AI SDK provider.

## Why Forge

- **Benchmark-leading.** Voxell's Ingot-8B-R3 ranks #1 for English on the public MTEB leaderboard
  (English v2), with a 75.98 mean task score across 41 tasks: the top usable English embedding
  model. See the [model card](https://huggingface.co/JCorners/Ingot-8B-R3).
- **Quality you can dial.** `turbo` (1024d) is the fast default and `ultra` (4096d) the highest
  quality tier. Pick your point on the quality and cost curve.
- **Matryoshka (MRL).** Truncate to fewer dimensions (re-normalized) for ~4× smaller, cheaper
  vectors — one option, minimal quality loss.
- **Low latency.** Served by a Go + CUDA engine; HTTP and gRPC.
- **Zero-trust.** Per-key auth; mTLS available.
- **Start free.** `turbo` is free forever, no card: [dash.voxell.ai](https://dash.voxell.ai). Learn more:
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
| `ultra` | 4096 | highest quality |

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
