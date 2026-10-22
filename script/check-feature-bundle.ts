export type FeatureChunk = {
  fileName: string;
  imports: string[];
  modules: Record<string, unknown>;
};

type FeatureBoundary = { entry: string; deferred: string[] };

const detailModule = "_authenticated/_shell/business/comic-detail/ComicDetailModal.tsx";
const boundaries: FeatureBoundary[] = [
  { entry: "_authenticated/_shell/workspace/business/Workspace.tsx", deferred: [detailModule] },
  {
    entry: "_authenticated/_shell/comic-playground/business/ComicPlayground.tsx",
    deferred: [detailModule],
  },
  {
    entry: "_authenticated/_shell/utilities/business/Utilities.tsx",
    deferred: [
      "_authenticated/_shell/utilities/business/BoundedCompressionTool.tsx",
      "_authenticated/_shell/utilities/business/TeamTerminologyTool.tsx",
    ],
  },
  {
    entry: "_authenticated/translator/business/BaseTranslator.tsx",
    deferred: [
      "_authenticated/translator/business/editor/editing-mode.ts",
      "_authenticated/translator/business/editor/read-only-mode.ts",
    ],
  },
];

function includesModule(chunk: FeatureChunk, module: string): boolean {
  return Object.keys(chunk.modules).some((id) =>
    id.replaceAll("\\", "/").endsWith(`/src/route/${module}`),
  );
}

function staticDependencies(chunks: FeatureChunk[], entries: FeatureChunk[]): Set<string> {
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const visited = new Set<string>();
  const pending = entries.map((chunk) => chunk.fileName);
  while (pending.length > 0) {
    const name = pending.pop();
    if (!name || visited.has(name)) continue;
    visited.add(name);
    pending.push(...(byName.get(name)?.imports ?? []));
  }
  return visited;
}

export function checkFeatureBundles(
  chunks: FeatureChunk[],
  contracts: FeatureBoundary[] = boundaries,
): void {
  for (const { entry, deferred } of contracts) {
    const owners = chunks.filter((chunk) => includesModule(chunk, entry));
    if (owners.length === 0)
      throw new Error(`Missing feature entry in production output: ${entry}`);
    const initialFiles = staticDependencies(chunks, owners);
    for (const module of deferred) {
      const moduleChunks = chunks.filter((chunk) => includesModule(chunk, module));
      if (moduleChunks.length === 0) throw new Error(`Missing deferred feature: ${module}`);
      if (moduleChunks.some((chunk) => initialFiles.has(chunk.fileName))) {
        throw new Error(
          `Deferred feature ${module} leaked into ${entry}'s static dependency graph`,
        );
      }
    }
  }
}
