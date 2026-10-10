import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearDragListeners,
  startPageDrag,
  type DragContext,
  type DragRequest,
  type MarkerPreview,
} from "./page-drag";

type Args = Pick<
  DragContext,
  "imgRef" | "transform" | "setTransform" | "onFocusMarker" | "onMoveMarker" | "tryAddMarker"
>;
type PageDrag = {
  dragMarker: MarkerPreview | null;
  isPanning: boolean;
  startDrag: (request: DragRequest) => void;
};

export function usePageDrag(args: Args): PageDrag {
  const [dragMarker, setDragMarker] = useState<MarkerPreview | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<DragContext["dragRef"]["current"]>(null);
  const dragMarkerRef = useRef<MarkerPreview | null>(null);
  const windowHandlersRef = useRef<DragContext["windowHandlersRef"]["current"]>(null);
  const { imgRef, transform, setTransform, onFocusMarker, onMoveMarker, tryAddMarker } = args;

  const startDrag = useCallback(
    (request: DragRequest) => {
      startPageDrag(request, {
        imgRef,
        transform,
        setTransform,
        onFocusMarker,
        onMoveMarker,
        tryAddMarker,
        dragRef,
        dragMarkerRef,
        windowHandlersRef,
        setDragMarker,
        setIsPanning,
      });
    },
    [imgRef, transform, setTransform, onFocusMarker, onMoveMarker, tryAddMarker],
  );

  useEffect(() => {
    return () => {
      clearDragListeners(windowHandlersRef);
    };
  }, []);

  return { dragMarker, isPanning, startDrag };
}
