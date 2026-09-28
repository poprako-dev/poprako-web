import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

export function routeDirectories(root: string): Set<string> {
  const result = new Set<string>();
  if (!existsSync(join(root, "src/route"))) return result;
  const pending = ["src/route"];
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) continue;
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name !== "business") pending.push(`${directory}/${entry.name}`);
        continue;
      }
      if (!entry.name.endsWith(".tsx")) continue;
      const content = readFileSync(join(root, directory, entry.name), "utf8");
      if (
        ["index.tsx", "route.tsx", "__root.tsx"].includes(entry.name) ||
        /\bcreateFileRoute\s*\(/u.test(content)
      ) {
        result.add(directory);
      }
    }
  }
  return result;
}

export function sourceDomain(path: string, owners: Set<string>): string | undefined {
  if (!path.startsWith("src/route/")) return undefined;
  if (path.startsWith("src/route/business/")) return "@common-business";
  let directory = dirname(path);
  while (directory.startsWith("src/route")) {
    if (owners.has(directory)) return directory;
    directory = dirname(directory);
  }
  return undefined;
}

export function routeRelation(
  source: string,
  target: string,
  owners: Set<string>,
): "same" | "ancestor" | "sibling" | "other" {
  const sourceRoute = sourceDomain(source, owners);
  const targetRoute = sourceDomain(target, owners);
  if (!sourceRoute || !targetRoute) return "other";
  if (sourceRoute === targetRoute) return "same";
  if (targetRoute === "@common-business") return "ancestor";
  if (sourceRoute.startsWith(`${targetRoute}/`)) return "ancestor";
  return "sibling";
}
