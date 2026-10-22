import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { link, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "vitest";
import {
  declarationHash,
  findDeclaration,
  prepareDeclaration,
  prepareDependencies,
  restoreDeclarationFixture,
} from "./prepare-dependencies.ts";

async function writePinnedFixtureFiles(root: string): Promise<void> {
  const radix = join(root, "node_modules/@radix-ui/react-select");
  const radixOriginal = (
    await readFile(
      createRequire(realpathSync("node_modules/radix-ui/package.json"))
        .resolve("@radix-ui/react-select")
        .replace(/dist\/index\.js$/u, "dist/index.d.mts"),
      "utf8",
    )
  ).replace(
    'interface SelectPopperPositionProps extends Omit<PopperContentProps, "onPlaced">, ' +
      "SelectPopperPrivateProps",
    "interface SelectPopperPositionProps extends PopperContentProps, SelectPopperPrivateProps",
  );
  await writeFile(join(radix, "dist/index.d.mts"), radixOriginal);
}

async function withInstallation(
  run: (root: string, declaration: string, original: string) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "poprako-dependency-test-"));
  try {
    const prepared = await readFile(await findDeclaration(resolve(".")), "utf8");
    const original = restoreDeclarationFixture(prepareDeclaration(prepared));
    const framework = join(root, "node_modules/@storybook/react-vite");
    const renderer = join(root, "node_modules/@storybook/react");
    const radix = join(root, "node_modules/@radix-ui/react-select");
    await mkdir(framework, { recursive: true });
    await mkdir(join(root, "node_modules/radix-ui"), { recursive: true });
    await writeFile(join(root, "node_modules/radix-ui/package.json"), "{}");
    await mkdir(join(renderer, "dist"), { recursive: true });
    await mkdir(join(radix, "dist"), { recursive: true });
    await writeFile(join(framework, "package.json"), '{"name":"@storybook/react-vite"}');
    await writeFile(
      join(renderer, "package.json"),
      '{"name":"@storybook/react","version":"10.6.2"}',
    );
    await writeFile(join(radix, "package.json"), '{"version":"2.3.7","main":"dist/index.js"}');
    await writeFile(join(radix, "dist/index.js"), "");
    const declaration = join(renderer, "dist/chunk-ojHmM-yX.d.ts");
    await writeFile(declaration, original);
    await writePinnedFixtureFiles(root);
    await run(root, declaration, original);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("preparation is local, atomic and idempotent; check does not write", async () => {
  await withInstallation(async (root, declaration, original) => {
    const cached = join(root, "cached-original.d.ts");
    await link(declaration, cached);
    await assert.rejects(prepareDependencies(root, "check"), /not prepared/u);
    assert.equal(await readFile(declaration, "utf8"), original);
    const result = await prepareDependencies(root, "apply");
    assert.equal(result.changed, true);
    assert.equal(await readFile(cached, "utf8"), original);
    const prepared = await readFile(declaration, "utf8");
    assert.equal(declarationHash(prepared), result.hash);
    assert.equal((await prepareDependencies(root, "apply")).changed, false);
    assert.equal((await prepareDependencies(root, "check")).changed, false);
    assert.equal(await readFile(declaration, "utf8"), prepared);
  });
});

test("unknown declarations and package upgrades fail without writes", async () => {
  await withInstallation(async (root, declaration) => {
    await writeFile(declaration, "unknown content\n");
    await assert.rejects(prepareDependencies(root, "apply"), /Unknown Storybook declaration/u);
    assert.equal(await readFile(declaration, "utf8"), "unknown content\n");
    await writeFile(
      join(root, "node_modules/@storybook/react/package.json"),
      '{"version":"10.6.3"}',
    );
    await assert.rejects(prepareDependencies(root, "apply"), /requires @storybook\/react 10.6.2/u);
  });
});
