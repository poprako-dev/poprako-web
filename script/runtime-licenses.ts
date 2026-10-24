import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const execute = promisify(execFile);

export type LicensedPackage = {
  name: string;
  versions: string[];
  paths: string[];
  license: string;
};

const LICENSES = new Set([
  "MIT",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "Unlicense",
  "0BSD",
  "(MIT OR GPL-3.0-or-later)",
  "(MIT AND Zlib)",
]);

async function packageNotices(
  directory: string,
): Promise<{ texts: string[]; hasLicense: boolean }> {
  const files = (await readdir(directory)).filter((name) =>
    /^(?:licen[sc]e|copying|notice|authors)(?:[.-]|$)/iu.test(name),
  );
  const ordered = files.sort();
  const texts = await Promise.all(ordered.map((name) => readFile(join(directory, name), "utf8")));
  const hasLicense = ordered.some(
    (name, index) => /^(?:licen[sc]e|copying)/iu.test(name) && Boolean(texts[index]?.trim()),
  );
  return { texts, hasLicense };
}

async function fallbackNotice(
  root: string,
  entry: LicensedPackage,
  directory: string,
): Promise<string> {
  if (entry.name === "react-remove-scroll-bar") {
    return readFile(join(root, "public/license/react-remove-scroll-bar-LICENSE.txt"), "utf8");
  }
  if (entry.name === "isarray") {
    const readme = await readFile(join(directory, "README.md"), "utf8");
    const start = readme.indexOf("## License");
    if (start >= 0 && readme.includes("Permission is hereby granted")) return readme.slice(start);
  }
  throw new Error(`Missing license text for ${entry.name}@${entry.versions.join(", ")}`);
}

async function pakoNotice(directory: string): Promise<string> {
  const source = await readFile(join(directory, "lib/zlib/deflate.js"), "utf8");
  const start = source.indexOf("// (C)");
  const end = source.indexOf("\n\n", start);
  if (start < 0 || end < 0) throw new Error("Missing pako Zlib source notice");
  return source.slice(start, end);
}

export async function collectRuntimeLicenses(
  root: string,
  entries: LicensedPackage[],
): Promise<string> {
  const sections = [
    "# Runtime dependency licenses",
    "Includes all production dependencies, including worker dependencies. " +
      "JSZip is used under its MIT option. Separate font and native notices accompany this file.",
  ];
  for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
    if (!LICENSES.has(entry.license)) {
      throw new Error(`Unreviewed license for ${entry.name}: ${entry.license}`);
    }
    for (const directory of entry.paths) {
      const { texts: notices, hasLicense } = await packageNotices(directory);
      if (!hasLicense) notices.push(await fallbackNotice(root, entry, directory));
      if (entry.name === "pako") notices.push(await pakoNotice(directory));
      const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8")) as {
        version: string;
      };
      sections.push(`## ${entry.name}@${manifest.version} (${entry.license})`, ...notices);
    }
  }
  return `${sections.join("\n\n")}\n`;
}

export function runtimeLicenses(): Plugin {
  let root = "";
  return {
    name: "poprako-runtime-licenses",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async generateBundle() {
      const { stdout } = await execute("pnpm", ["licenses", "list", "--prod", "--json"], {
        cwd: root,
        maxBuffer: 8 * 1024 * 1024,
      });
      const groups = JSON.parse(stdout) as Record<string, LicensedPackage[]>;
      this.emitFile({
        type: "asset",
        fileName: "RUNTIME-LICENSES.txt",
        source: await collectRuntimeLicenses(root, Object.values(groups).flat()),
      });
      this.emitFile({
        type: "asset",
        fileName: "LICENSE.txt",
        source: await readFile(join(root, "LICENSE"), "utf8"),
      });
    },
  };
}
