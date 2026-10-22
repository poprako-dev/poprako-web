import { expect, test } from "vitest";
import { checkFeatureBundles, type FeatureChunk } from "./check-feature-bundle.ts";

const contracts = [{ entry: "list.tsx", deferred: ["detail.tsx"] }];

function chunk(fileName: string, modules: string[], imports: string[] = []): FeatureChunk {
  return {
    fileName,
    imports,
    modules: Object.fromEntries(modules.map((name) => [`/project/src/route/${name}`, {}])),
  };
}

test("accepts deferred feature code outside the static entry dependency closure", () => {
  const chunks = [
    chunk("list.js", ["list.tsx"], ["shared.js"]),
    chunk("shared.js", ["shared.ts"]),
    chunk("detail.js", ["detail.tsx"], ["shared.js"]),
  ];
  expect(() => {
    checkFeatureBundles(chunks, contracts);
  }).not.toThrow();
});

test("detects deferred code pulled back into the entry through a shared chunk", () => {
  const chunks = [
    chunk("list.js", ["list.tsx"], ["shared.js"]),
    chunk("shared.js", ["shared.ts"], ["detail.js"]),
    chunk("detail.js", ["detail.tsx"], ["shared.js"]),
  ];
  expect(() => {
    checkFeatureBundles(chunks, contracts);
  }).toThrow("leaked");
});

test("detects entry and feature modules merged into the same output chunk", () => {
  expect(() => {
    checkFeatureBundles([chunk("list.js", ["list.tsx", "detail.tsx"])], contracts);
  }).toThrow("leaked");
});

test("fails when a guarded module has disappeared instead of silently accepting the contract", () => {
  expect(() => {
    checkFeatureBundles([chunk("list.js", ["list.tsx"])], contracts);
  }).toThrow("Missing deferred feature");
  expect(() => {
    checkFeatureBundles([chunk("detail.js", ["detail.tsx"])], contracts);
  }).toThrow("Missing feature entry");
});
