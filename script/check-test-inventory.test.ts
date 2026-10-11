import { test } from "vitest";
import { realpathSync } from "node:fs";
import { deepStrictEqual as assertEquals } from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { assignTestRunners, buildTestInventory } from "./check-test-inventory.ts";

test("runner assignment covers unit, integration, Storybook, and script tests", () => {
  assertEquals(assignTestRunners("src/user/user.test.ts", "script"), ["vitest:unit"]);
  assertEquals(assignTestRunners("src/user/user.spec.tsx", "script"), ["vitest:integration"]);
  assertEquals(assignTestRunners("src/user/User.stories.tsx", "script"), ["storybook:browser"]);
  assertEquals(assignTestRunners("src/docs/guide.mdx", "script"), ["storybook:browser"]);
  assertEquals(assignTestRunners("script/check.test.mjs", "script"), ["vitest:script"]);
  assertEquals(assignTestRunners("script/check_test.ts", "script"), []);
});

test("runner assignment rejects ambiguous and undiscovered test names", () => {
  assertEquals(assignTestRunners("script/Helper.stories.tsx", "script"), []);
  assertEquals(assignTestRunners("src/user/user.test.mjs", "script"), []);
  assertEquals(assignTestRunners("src/user/user.test.ts", null), ["vitest:unit"]);
});

test("the checked source inventory assigns every current test-like file once", async () => {
  const root = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
  const inventory = await buildTestInventory(root);
  assertEquals(inventory.issues, []);
  if (inventory.files.length === 0) {
    throw new Error("Expected a non-empty source test inventory");
  }
});
