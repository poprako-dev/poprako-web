import { deepStrictEqual as assertEquals } from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { assignTestRunners, buildTestInventory } from "./check-test-inventory.ts";

Deno.test("runner assignment covers unit, integration, Storybook, and Deno tests", () => {
  assertEquals(assignTestRunners("src/user/user.test.ts", "script"), ["vitest:unit"]);
  assertEquals(assignTestRunners("src/user/user.spec.tsx", "script"), ["vitest:integration"]);
  assertEquals(assignTestRunners("src/user/User.stories.tsx", "script"), ["storybook:browser"]);
  assertEquals(assignTestRunners("src/docs/guide.mdx", "script"), ["storybook:browser"]);
  assertEquals(assignTestRunners("script/check.test.mjs", "script"), ["deno:test-script"]);
  assertEquals(assignTestRunners("script/check_test.ts", "script"), ["deno:test-script"]);
});

Deno.test("runner assignment rejects ambiguous and undiscovered test names", () => {
  assertEquals(assignTestRunners("script/Helper.stories.tsx", "script"), []);
  assertEquals(assignTestRunners("src/user/user.test.mjs", "script"), []);
  assertEquals(assignTestRunners("src/user/user.test.ts", null), ["vitest:unit"]);
});

Deno.test("the checked source inventory assigns every current test-like file once", async () => {
  const root = Deno.realPathSync(fileURLToPath(new URL("../", import.meta.url)));
  const inventory = await buildTestInventory(root);
  assertEquals(inventory.issues, []);
  if (inventory.files.length === 0) {
    throw new Error("Expected a non-empty source test inventory");
  }
});
