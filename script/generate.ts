import { Generator, getConfig } from "@tanstack/router-generator";
import { cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { routeConfiguration } from "./route-config.ts";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");

if (!checkOnly) {
  const config = getConfig(routeConfiguration, root);
  await new Generator({ config, root }).run();
} else {
  const tempRoot = await mkdtemp(join(tmpdir(), "poprako-routes-"));
  try {
    await cp(resolve(root, "src/routes"), join(tempRoot, "src/routes"), { recursive: true });
    const config = getConfig(routeConfiguration, tempRoot);
    await new Generator({ config, root: tempRoot }).run();

    const expectedTree = await readFile(
      resolve(root, routeConfiguration.generatedRouteTree),
      "utf8",
    );
    const generatedTree = await readFile(
      resolve(tempRoot, routeConfiguration.generatedRouteTree),
      "utf8",
    );
    if (generatedTree !== expectedTree) {
      throw new Error("route-tree.gen.ts is stale; run `deno task generate`.");
    }

    const originalRoutes = resolve(root, "src/routes");
    const generatedRoutes = resolve(tempRoot, "src/routes");
    const changed = await findChangedFiles(originalRoutes, generatedRoutes);
    if (changed.length > 0) {
      throw new Error(`Route inputs need generator updates: ${changed.join(", ")}`);
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function findChangedFiles(originalDir: string, generatedDir: string): Promise<string[]> {
  const changed: string[] = [];
  for (const entry of await readdir(originalDir, { withFileTypes: true })) {
    const originalPath = join(originalDir, entry.name);
    const generatedPath = join(generatedDir, entry.name);
    if (entry.isDirectory()) {
      changed.push(...(await findChangedFiles(originalPath, generatedPath)));
      continue;
    }
    const [original, generated] = await Promise.all([
      readFile(originalPath),
      readFile(generatedPath),
    ]);
    if (!original.equals(generated)) {
      changed.push(originalPath);
    }
  }
  return changed;
}
