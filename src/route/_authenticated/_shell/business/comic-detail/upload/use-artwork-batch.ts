import { useEffect, useSyncExternalStore } from "react";
import type { ArtworkBatch, ArtworkBatchSnapshot } from "./artwork-batch-types";
const empty: ArtworkBatchSnapshot = { tasks: [], running: false, error: null };
function subscribe(): () => void {
  return () => {
    return;
  };
}
function getSnapshot(): ArtworkBatchSnapshot {
  return empty;
}
export function useArtworkBatch(batch: ArtworkBatch | null): ArtworkBatchSnapshot {
  const state = useSyncExternalStore(
    batch?.subscribe ?? subscribe,
    batch?.getSnapshot ?? getSnapshot,
  );
  useEffect(
    () => () => {
      void batch?.dispose().catch((error: unknown) => {
        console.error("清理嵌稿上传临时文件失败", error);
      });
    },
    [batch],
  );
  return state;
}
