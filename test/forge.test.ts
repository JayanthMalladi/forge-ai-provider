// Drives the provider through the real AI SDK (`embed`/`embedMany`) against the live Forge API.
// Live tests skip without FORGE_API_KEY (honest skip, no faking).
import { test } from "node:test";
import assert from "node:assert/strict";
import { embed, embedMany } from "ai";
import { createForge } from "../src/index.js";

const KEY = process.env.FORGE_API_KEY;
const BASE = process.env.FORGE_BASE_URL || "https://api.voxell.ai";
const skip = KEY ? false : "set FORGE_API_KEY to run live tests";
const forge = createForge({ apiKey: KEY, baseURL: BASE });

test("model shape (no network)", () => {
  const m = createForge({ apiKey: "x" }).textEmbeddingModel("turbo");
  assert.equal(m.specificationVersion, "v3");
  assert.equal(m.modelId, "turbo");
  assert.equal(m.provider, "forge.embedding");
  assert.equal(m.supportsParallelCalls, true);
});

const DIMS: Array<[string, number]> = [
  ["turbo", 1024],
  ["pro", 2560],
  ["ultra", 4096],
];
for (const [model, dim] of DIMS) {
  test(`embed via AI SDK: ${model} → ${dim}-d`, { skip }, async () => {
    const { embedding } = await embed({ model: forge.textEmbeddingModel(model), value: "why forge" });
    assert.equal(embedding.length, dim);
    assert.ok(embedding.every((n) => Number.isFinite(n)));
  });
}

test("embedMany: 2 values → 2 vectors + usage", { skip }, async () => {
  const { embeddings, usage } = await embedMany({
    model: forge.textEmbeddingModel("turbo"),
    values: ["alpha", "beta"],
  });
  assert.equal(embeddings.length, 2);
  assert.equal(embeddings[0].length, 1024);
  assert.ok((usage?.tokens ?? 0) > 0);
});

test("Matryoshka via providerOptions.forge.dimensions → 256", { skip }, async () => {
  const { embedding } = await embed({
    model: forge.textEmbeddingModel("turbo"),
    value: "truncate me",
    providerOptions: { forge: { dimensions: 256 } },
  });
  assert.equal(embedding.length, 256);
});

test("default model (forge()) is turbo/1024", { skip }, async () => {
  const { embedding } = await embed({ model: forge(), value: "default" });
  assert.equal(embedding.length, 1024);
});
