export type HeavyChunk = {
  fileName: string;
  imports: string[];
  modules: Record<string, unknown>;
  isEntry: boolean;
  code: string;
};

const utilitiesModule = "/src/route/_authenticated/_shell/utilities/business/Utilities.tsx";
const heavyPackage =
  /\/node_modules\/(?:@zip\.js\/zip\.js|simple-wasi-zstd|ag-psd|browser-image-compression|modern-tar|jszip)(?:\/|$)/u;
const codecModule =
  /\/src\/shared\/utility\/(?:compress\/(?:archive-worker|core|zstd|zstd-codec)|image\/composite-worker)\.ts$/u;
const boundedImplementation =
  "/src/route/_authenticated/_shell/utilities/business/bounded-compression.ts";
const wasmCode = /\bWebAssembly\s*\.\s*(?:compile|instantiate)(?:Streaming)?\s*\(|AGFzbQE/u;

function normalizeModule(id: string): string {
  return id.replaceAll("\\", "/").split("?")[0] ?? id;
}

function heavyModule(chunk: HeavyChunk): string | undefined {
  return Object.keys(chunk.modules).find((id) => {
    const path = normalizeModule(id);
    return (
      heavyPackage.test(path) ||
      codecModule.test(path) ||
      path.endsWith(boundedImplementation) ||
      path.endsWith(".wasm")
    );
  });
}

function staticDependencies(chunks: HeavyChunk[], entries: HeavyChunk[]): HeavyChunk[] {
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const visited = new Set<string>();
  const pending = [...entries];
  const result: HeavyChunk[] = [];
  while (pending.length > 0) {
    const chunk = pending.pop();
    if (!chunk || visited.has(chunk.fileName)) continue;
    visited.add(chunk.fileName);
    result.push(chunk);
    for (const name of chunk.imports) {
      const dependency = byName.get(name);
      if (dependency) pending.push(dependency);
    }
  }
  return result;
}

function checkStaticBoundary(chunks: HeavyChunk[], entries: HeavyChunk[], label: string): void {
  if (entries.length === 0) throw new Error(`Missing heavy bundle boundary entry: ${label}`);
  for (const chunk of staticDependencies(chunks, entries)) {
    const module = heavyModule(chunk);
    if (module || wasmCode.test(chunk.code)) {
      throw new Error(
        `Heavy codec ${module ?? "embedded WASM"} leaked into ${label}: ${chunk.fileName}`,
      );
    }
  }
}

function moduleOwners(chunks: HeavyChunk[], suffix: string): HeavyChunk[] {
  return chunks.filter((chunk) =>
    Object.keys(chunk.modules).some((id) => normalizeModule(id).endsWith(suffix)),
  );
}

export function checkHeavyBundles(chunks: HeavyChunk[], routeModules: readonly string[]): void {
  checkStaticBoundary(
    chunks,
    chunks.filter((chunk) => chunk.isEntry),
    "initial static dependency graph",
  );
  checkStaticBoundary(
    chunks,
    moduleOwners(chunks, utilitiesModule),
    "Utilities static dependency graph",
  );
  for (const route of routeModules) {
    checkStaticBoundary(
      chunks,
      moduleOwners(chunks, `/src/route/${route}`),
      `route ${route} static dependency graph`,
    );
  }
}
