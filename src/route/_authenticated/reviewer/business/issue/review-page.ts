import type { PageRect, PagePreview } from "@/shared/utility/page-geometry";
export type { PageRect } from "@/shared/utility/page-geometry";
export type ReviewLayer = {
  id: string;
  parentId: string | null;
  name: string;
  bounds: PageRect;
  visible: boolean;
};
export type ReviewPreview = PagePreview;
export type ReviewPage = {
  width: number;
  height: number;
  layers: ReviewLayer[];
  composite: ReviewPreview;
  dispose: () => void | Promise<void>;
};
export type LoadReviewPage = ((pageId: string, signal: AbortSignal) => Promise<ReviewPage>) | null;
export function includesReviewLayer(
  layers: ReviewLayer[],
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
