import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRuntimeCycles } from "./check-cycle.ts";

void test("cycle checker follows runtime imports but not type-only references", () => {
  const edge = { line: 1, clause: "module declaration" };
  assert.equal(
    checkRuntimeCycles([
      { ...edge, from: "src/api/first.ts", to: "src/api/second.ts" },
      { ...edge, from: "src/api/second.ts", to: "src/api/first.ts" },
    ]).length,
    1,
  );
  assert.deepEqual(
    checkRuntimeCycles([
      { ...edge, from: "src/api/first.ts", to: "src/api/second.ts" },
      { ...edge, from: "src/api/second.ts", to: "src/api/first.ts", typeOnly: true },
    ]),
    [],
  );
});
