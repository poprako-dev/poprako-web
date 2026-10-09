import type { PageRect, PagePreview } from "@/shared/utility/page-geometry";
export type { PageRect } from "@/shared/utility/page-geometry";
export type RevisionLayer = {
  id: string;
  parentId: string | null;
  name: string;
  bounds: PageRect;
  visible: boolean;
};
export type RevisionPreview = PagePreview;
export type RevisionPage = {
  width: number;
  height: number;
  layers: RevisionLayer[];
  composite: RevisionPreview;
  dispose: () => void;
};
export type LoadRevisionPage =
  | ((pageId: string, signal: AbortSignal) => Promise<RevisionPage>)
  | null;
export function includesRevisionLayer(
  layers: RevisionLayer[],
  selectedId: string | null,
  layerId: string | null,
): boolean {
  if (selectedId === null) return true;
  const visited = new Set<string>();
  let current = layerId;
  while (current !== null && !visited.has(current)) {
    if (current === selectedId) return true;
    visited.add(current);
    current = layers.find((layer) => layer.id === current)?.parentId ?? null;
  }
  return false;
}
