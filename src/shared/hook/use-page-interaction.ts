import type { PageImageSource } from "@/shared/utility/page-geometry";
import type { RefObject } from "react";
import type { Dispatch } from "react";
import type { SetStateAction } from "react";
import { type Transform, useCanvasViewport } from "./use-canvas-viewport.ts";

export type PageEditing = {
  isMarkerCreationEnabled: boolean;
  enableReadOnly: boolean;
  onFocusMarker: (markerId: string) => void;
  onMoveMarker: (markerId: string, xCoord: number, yCoord: number) => void;
  onAddMarker: (xCoord: number, yCoord: number, alternate: boolean) => void;
  onDeleteMarker: (markerId: string) => void;
};

function ignore(): void {
  /* No editing actions in the read-only viewport. */
}

import { usePageDrag } from "./use-page-drag";
import {
  useCanvasPointer,
  useMarkerPointer,
  useMarkerCreation,
  usePageContextMenu,
} from "./use-page-pointer";

type Args = { imageSrc: PageImageSource | null; editing?: PageEditing };

export type PageInteraction = {
  containerRef: RefObject<HTMLDivElement | null>;
  imgRef: RefObject<HTMLImageElement | HTMLCanvasElement | null>;
  transform: Transform;
  setTransform: Dispatch<SetStateAction<Transform>>;
  containerSize: { w: number; h: number };
  dragMarker: { id: string; x: number; y: number } | null;
  isPanning: boolean;
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleMarkerMouseDown: (
    e: React.MouseEvent,
    markerId: string,
    xCoord: number,
    yCoord: number,
  ) => void;
  handleMarkerTouchStart: (
    e: React.TouchEvent,
    markerId: string,
    xCoord: number,
    yCoord: number,
  ) => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  handleWheel: (e: WheelEvent) => void;
};

export function usePageInteraction({ imageSrc, editing }: Args): PageInteraction {
  const {
    isMarkerCreationEnabled = false,
    enableReadOnly = true,
    onFocusMarker = ignore,
    onMoveMarker = ignore,
    onAddMarker = ignore,
    onDeleteMarker = ignore,
  } = editing ?? {};
  const { containerRef, imgRef, transform, setTransform, containerSize, handleWheel } =
    useCanvasViewport({ imageSrc });
  const tryAddMarker = useMarkerCreation(imgRef, isMarkerCreationEnabled, onAddMarker);
  const { dragMarker, isPanning, startDrag } = usePageDrag({
    imgRef,
    transform,
    setTransform,
    onFocusMarker,
    onMoveMarker,
    tryAddMarker,
  });
  const handleCanvasMouseDown = useCanvasPointer({ imgRef, containerRef, startDrag });
  const { handleMarkerMouseDown, handleMarkerTouchStart } = useMarkerPointer(
    enableReadOnly,
    onFocusMarker,
    startDrag,
  );
  const handleContextMenu = usePageContextMenu(enableReadOnly, onDeleteMarker, tryAddMarker);

  return {
    containerRef,
    imgRef,
    transform,
    setTransform,
    containerSize,
    dragMarker,
    isPanning,
    handleCanvasMouseDown,
    handleMarkerMouseDown,
    handleMarkerTouchStart,
    handleContextMenu,
    handleWheel,
  };
}
