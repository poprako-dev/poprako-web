import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { DragSession } from "./unit-reorder-types";

function sameOrder(lhs: string[], rhs: string[]): boolean {
  return lhs.length === rhs.length && lhs.every((id, index) => id === rhs[index]);
}

export function useUnitReorderPreview(
  listRef: RefObject<HTMLDivElement | null>,
  dragRef: RefObject<DragSession | null>,
  setPreviewOrder: Dispatch<SetStateAction<string[] | null>>,
): (clientY: number) => void {
  return useCallback(
    (clientY: number) => {
      const session = dragRef.current;
      const list = listRef.current;
      if (!session?.didDrag || !list) return;

      const rows = [...list.querySelectorAll<HTMLElement>("[data-unit-id]")];
      const rowsById = new Map(rows.map((row) => [row.dataset["unitId"], row]));
      const remainingIds = session.previewOrder.filter((id) => id !== session.unitId);
      const targetIndex = findPreviewIndex(remainingIds, rowsById, clientY);
      const nextOrder = [...remainingIds];
      nextOrder.splice(targetIndex, 0, session.unitId);
      if (sameOrder(nextOrder, session.previewOrder)) return;

      session.previewOrder = nextOrder;
      setPreviewOrder(nextOrder);
    },
    [dragRef, listRef, setPreviewOrder],
  );
}

function findPreviewIndex(
  remainingIds: string[],
  rowsById: Map<string | undefined, HTMLElement>,
  clientY: number,
): number {
  let index = 0;
  for (const id of remainingIds) {
    const row = rowsById.get(id);
    if (!row) continue;
    const rect = row.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) break;
    index += 1;
  }
  return index;
}
