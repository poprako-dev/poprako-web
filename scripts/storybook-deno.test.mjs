import assert from "node:assert/strict";
import { DenoPackageManager } from "./storybook-deno.mjs";

Deno.test("reads installed Storybook packages without another package manager", async () => {
  const manager = new DenoPackageManager({ cwd: Deno.cwd(), configDir: ".storybook" });
  const storybook = await manager.getModulePackageJSON("storybook");
  assert.equal(storybook.name, "storybook");
  assert.equal(await manager.getInstalledVersion("storybook"), storybook.version);
  assert.equal(await manager.getModulePackageJSON("poprako-missing-package"), null);

  const installations = await manager.findInstallations(["@storybook/*"]);
  assert.ok(installations.dependencies["@storybook/react-vite"]);
  assert.equal(installations.dependencies.react, undefined);
});

Deno.test("executes local package commands through Deno with literal arguments", async () => {
  const manager = new DenoPackageManager({ cwd: Deno.cwd() });
  const values = ["two words", "it's literal", "$(printf unexpected)", '`printf unexpected`'];
  const result = await manager.runPackageCommand({
    args: [Deno.execPath(), "eval", "console.log(JSON.stringify(Deno.args))", ...values],
    stdio: "pipe",
  });
  assert.deepEqual(JSON.parse(result.stdout), values);
});
