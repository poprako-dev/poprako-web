import assert from "node:assert/strict";
import { link, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import {
  declarationHash,
  findDeclaration,
  prepareDeclaration,
  prepareDependencies,
  restoreDeclarationFixture,
} from "./prepare-dependencies.ts";

async function writePinnedFixtureFiles(root: string): Promise<void> {
  const radix = join(
    root,
    "node_modules/.deno/@radix-ui+react-select@2.3.7/node_modules/@radix-ui/react-select",
  );
  const liblzma = join(root, "node_modules/.deno/node-liblzma@5.1.1/node_modules/node-liblzma");
  const radixOriginal = (
    await readFile(
      "node_modules/.deno/@radix-ui+react-select@2.3.7/node_modules/" +
        "@radix-ui/react-select/dist/index.d.mts",
      "utf8",
    )
  ).replace(
    'interface SelectPopperPositionProps extends Omit<PopperContentProps, "onPlaced">, ' +
      "SelectPopperPrivateProps",
    "interface SelectPopperPositionProps extends PopperContentProps, SelectPopperPrivateProps",
  );
  const liblzmaOriginal = (
    await readFile(
      "node_modules/.deno/node-liblzma@5.1.1/node_modules/" + "node-liblzma/src/wasm/liblzma.d.ts",
      "utf8",
    )
  ).replace('from "../../lib/wasm/types.js"', 'from "./types.js"');
  await writeFile(join(radix, "dist/index.d.mts"), radixOriginal);
  await writeFile(join(liblzma, "src/wasm/liblzma.d.ts"), liblzmaOriginal);
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
    const radix = join(
      root,
      "node_modules/.deno/@radix-ui+react-select@2.3.7/node_modules/@radix-ui/react-select",
    );
    const liblzma = join(root, "node_modules/.deno/node-liblzma@5.1.1/node_modules/node-liblzma");
    await mkdir(framework, { recursive: true });
    await mkdir(join(renderer, "dist"), { recursive: true });
    await mkdir(join(radix, "dist"), { recursive: true });
    await mkdir(join(liblzma, "src/wasm"), { recursive: true });
    await writeFile(join(framework, "package.json"), '{"name":"@storybook/react-vite"}');
    await writeFile(
      join(renderer, "package.json"),
      '{"name":"@storybook/react","version":"10.6.0"}',
    );
    await writeFile(join(radix, "package.json"), '{"version":"2.3.7"}');
    await writeFile(join(liblzma, "package.json"), '{"version":"5.1.1"}');
    const declaration = join(renderer, "dist/chunk-ojHmM-yX.d.ts");
    await writeFile(declaration, original);
    await writePinnedFixtureFiles(root);
    await run(root, declaration, original);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

void test("preparation is local, atomic and idempotent; check does not write", async () => {
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

void test("unknown declarations and package upgrades fail without writes", async () => {
  await withInstallation(async (root, declaration) => {
    await writeFile(declaration, "unknown content\n");
    await assert.rejects(prepareDependencies(root, "apply"), /Unknown Storybook declaration/u);
    assert.equal(await readFile(declaration, "utf8"), "unknown content\n");
    await writeFile(
      join(root, "node_modules/@storybook/react/package.json"),
      '{"version":"10.6.1"}',
    );
    await assert.rejects(prepareDependencies(root, "apply"), /requires @storybook\/react 10.6.0/u);
  });
});
