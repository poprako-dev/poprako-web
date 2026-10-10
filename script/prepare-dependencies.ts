import { createHash, randomUUID } from "node:crypto";
import { readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const PACKAGE_VERSION = "10.6.0";
const DECLARATION_FILE = "dist/chunk-ojHmM-yX.d.ts";
const ORIGINAL_HASH = "38cd16dff5398eb4ea0ec7286ad2923b51631672dc3cd3a224048e8482820c79";
const PREPARED_HASH = "fdfbabf470c56421cf57f998b542c495824c4b91a51cf57aa7f08244a60d7763";

const ORIGINAL_META =
  "interface ReactMeta<T extends ReactTypes, MetaInput extends ComponentAnnotations<T>> " +
  "/** @ts-expect-error ReactMeta requires two type parameters, but Meta's constraints differ */ " +
  "extends Meta<T, MetaInput> {";
const PREPARED_META =
  "/** @ts-expect-error ReactMeta requires two type parameters, but Meta's constraints differ */\n" +
  "interface ReactMeta<T extends ReactTypes, MetaInput extends ComponentAnnotations<T>> " +
  "extends Meta<T, MetaInput> {";
const ORIGINAL_STORY =
  "  story<TInput extends Simplify<StoryAnnotations<T, AddMocks<T['args'], MetaInput['args']>, " +
  "SetOptional<T['args'], keyof T['args'] & keyof MetaInput['args']>>>>" +
  "(story: TInput /** @ts-expect-error hard */): ReactStory<T, TInput>;";
const PREPARED_STORY =
  "  /** @ts-expect-error hard */\n" +
  "  story<TInput extends Simplify<StoryAnnotations<T, AddMocks<T['args'], MetaInput['args']>, " +
  "SetOptional<T['args'], keyof T['args'] & keyof MetaInput['args']>>>>" +
  "(story: TInput): ReactStory<T, TInput>;";
const RADIX_STORE_DIRECTORY = "@radix-ui+react-select@2.3.7";
const RADIX_PACKAGE = "@radix-ui/react-select";
const RADIX_DECLARATION = "dist/index.d.mts";
const RADIX_ORIGINAL_HASH = "a0fa43b27364a340ea7639ff5fdffbcd375ecf49e6ed5df3eec73b3d74a84d58";
const RADIX_PREPARED_HASH = "0e1ba18639e5838a7393eb9ca588f8832a4968f96f52bd8cd55ae2dce90a44d0";
const RADIX_ORIGINAL =
  "interface SelectPopperPositionProps extends PopperContentProps, SelectPopperPrivateProps";
const RADIX_PREPARED =
  'interface SelectPopperPositionProps extends Omit<PopperContentProps, "onPlaced">, ' +
  "SelectPopperPrivateProps";
const LIBLZMA_STORE_DIRECTORY = "node-liblzma@5.1.1";
const LIBLZMA_PACKAGE = "node-liblzma";
const LIBLZMA_DECLARATION = "src/wasm/liblzma.d.ts";
const LIBLZMA_ORIGINAL_HASH = "030f825f172c4a752e5878eda39e5f68a5d8fe433f425236d50fd928636a8fcd";
const LIBLZMA_PREPARED_HASH = "096b9049209f67341c7b5063909fc9322bd9a0555f61b48d69136c923fdf2ebd";
const LIBLZMA_ORIGINAL = 'from "./types.js"';
const LIBLZMA_PREPARED = 'from "../../lib/wasm/types.js"';

type PreparationMode = "apply" | "check";
type PreparationResult = { path: string; changed: boolean; hash: string };
type DependencyTarget = {
  path: string;
  label: string;
  prepare: (content: string) => string;
  expectedHash: string;
};

export function declarationHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function requireLocalPath(installation: string, file: string): void {
  const location = relative(installation, file);
  if (
    isAbsolute(location) ||
    location === ".." ||
    location.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  ) {
    throw new Error(`Dependency preparation refuses a path outside local node_modules: ${file}`);
  }
}

export async function findDeclaration(root: string): Promise<string> {
  const installation = join(await realpath(root), "node_modules");
  const framework = await realpath(join(installation, "@storybook/react-vite/package.json"));
  requireLocalPath(installation, framework);
  const require = createRequire(framework);
  const manifest = await realpath(require.resolve("@storybook/react/package.json"));
  requireLocalPath(installation, manifest);
  const parsed: unknown = JSON.parse(await readFile(manifest, "utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    parsed.version !== PACKAGE_VERSION
  ) {
    throw new Error("Dependency preparation requires @storybook/react 10.6.0; review any upgrade.");
  }
  const declaration = await realpath(join(dirname(manifest), DECLARATION_FILE));
  requireLocalPath(installation, declaration);
  return declaration;
}

async function findPinnedDeclaration(
  root: string,
  storeDirectory: string,
  packageName: string,
  version: string,
  declaration: string,
): Promise<string> {
  const installation = await realpath(join(root, "node_modules"));
  const packageDirectory = await realpath(
    join(installation, ".deno", storeDirectory, "node_modules", packageName),
  );
  requireLocalPath(installation, packageDirectory);
  const manifestPath = join(packageDirectory, "package.json");
  const parsed: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    parsed.version !== version
  ) {
    throw new Error(`Dependency preparation requires ${packageName}@${version}.`);
  }
  const path = await realpath(join(packageDirectory, declaration));
  requireLocalPath(installation, path);
  return path;
}

function preparePinnedFile(
  content: string,
  label: string,
  original: string,
  prepared: string,
  originalHash: string,
  preparedHash: string,
): string {
  const currentHash = declarationHash(content);
  if (currentHash === preparedHash) return content;
  if (currentHash !== originalHash || !content.includes(original)) {
    throw new Error(
      `Unknown ${label} declaration content (${currentHash}); review before preparing.`,
    );
  }
  const next = content.replace(original, prepared);
  if (next === content || declarationHash(next) !== preparedHash) {
    throw new Error(`${label} declaration did not produce the reviewed hash.`);
  }
  return next;
}

export function prepareDeclaration(content: string): string {
  const currentHash = declarationHash(content);
  if (currentHash === PREPARED_HASH) return content;
  if (currentHash !== ORIGINAL_HASH) {
    throw new Error(
      `Unknown Storybook declaration content (${currentHash}); review before preparing.`,
    );
  }
  const prepared = content
    .replace(ORIGINAL_META, PREPARED_META)
    .replace(ORIGINAL_STORY, PREPARED_STORY);
  if (declarationHash(prepared) !== PREPARED_HASH) {
    throw new Error("Storybook declaration formatting did not produce the reviewed hash.");
  }
  return prepared;
}

export function restoreDeclarationFixture(content: string): string {
  if (declarationHash(content) !== PREPARED_HASH) {
    throw new Error("The fixture must start from the reviewed prepared declaration.");
  }
  const original = content
    .replace(PREPARED_META, ORIGINAL_META)
    .replace(PREPARED_STORY, ORIGINAL_STORY);
  if (declarationHash(original) !== ORIGINAL_HASH)
    throw new Error("Invalid original fixture hash.");
  return original;
}

export async function prepareDependencies(
  root: string,
  mode: PreparationMode,
): Promise<PreparationResult> {
  const results: PreparationResult[] = [];
  for (const target of await dependencyTargets(root)) {
    results.push(await prepareTarget(target, mode));
  }
  const [storybook] = results;
  if (!storybook) throw new Error("No dependency declarations were prepared.");
  return storybook;
}

async function dependencyTargets(root: string): Promise<DependencyTarget[]> {
  return [
    {
      path: await findDeclaration(root),
      label: "Storybook",
      prepare: prepareDeclaration,
      expectedHash: PREPARED_HASH,
    },
    {
      path: await findPinnedDeclaration(
        root,
        RADIX_STORE_DIRECTORY,
        RADIX_PACKAGE,
        "2.3.7",
        RADIX_DECLARATION,
      ),
      label: "Radix Select",
      prepare: (content: string) =>
        preparePinnedFile(
          content,
          "Radix Select",
          RADIX_ORIGINAL,
          RADIX_PREPARED,
          RADIX_ORIGINAL_HASH,
          RADIX_PREPARED_HASH,
        ),
      expectedHash: RADIX_PREPARED_HASH,
    },
    {
      path: await findPinnedDeclaration(
        root,
        LIBLZMA_STORE_DIRECTORY,
        LIBLZMA_PACKAGE,
        "5.1.1",
        LIBLZMA_DECLARATION,
      ),
      label: "node-liblzma",
      prepare: (content: string) =>
        preparePinnedFile(
          content,
          "node-liblzma",
          LIBLZMA_ORIGINAL,
          LIBLZMA_PREPARED,
          LIBLZMA_ORIGINAL_HASH,
          LIBLZMA_PREPARED_HASH,
        ),
      expectedHash: LIBLZMA_PREPARED_HASH,
    },
  ];
}

async function prepareTarget(
  target: DependencyTarget,
  mode: PreparationMode,
): Promise<PreparationResult> {
  const content = await readFile(target.path, "utf8");
  if (mode === "check") return verifyPreparedTarget(target, content);
  const prepared = target.prepare(content);
  if (prepared === content) return { path: target.path, changed: false, hash: target.expectedHash };
  await writePreparedTarget(target.path, prepared);
  return { path: target.path, changed: true, hash: target.expectedHash };
}

function verifyPreparedTarget(target: DependencyTarget, content: string): PreparationResult {
  const hash = declarationHash(content);
  if (hash !== target.expectedHash) {
    throw new Error(
      `${target.label} declarations are not prepared; run deno task prepare:dependencies.`,
    );
  }
  return { path: target.path, changed: false, hash };
}

async function writePreparedTarget(path: string, content: string): Promise<void> {
  const temporary = `${path}.poprako-${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--check") || args.length > 1) {
    throw new Error("Usage: deno task prepare:dependencies [--check]");
  }
  const result = await prepareDependencies(
    process.cwd(),
    args.includes("--check") ? "check" : "apply",
  );
  process.stdout.write(
    `Storybook declaration ${result.changed ? "prepared" : "verified"}: ${result.hash}\n`,
  );
}
