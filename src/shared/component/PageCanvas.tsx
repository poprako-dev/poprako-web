import type { PageImageSource } from "@/shared/utility/page-geometry";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement, ReactNode, Ref } from "react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { PageImage } from "./PageImage";
import type { usePageInteraction } from "@/shared/hook/use-page-interaction";

const RELOCATION_DURATION_MS = 200;

export interface CanvasHandle {
  centerOn: (xCoord: number, yCoord: number) => void;
}

type Props = {
  empty?: ReactNode;
  overlay?: ReactNode | ((scale: number) => ReactNode);
  onImageError?: (() => void) | undefined;
  imageSrc: PageImageSource | null;
  isLoading: boolean;
  interaction: ReturnType<typeof usePageInteraction>;
  onImageLoad?: (() => void) | undefined;
  ref: Ref<CanvasHandle>;
};

function useCanvasRelocation(ref: Props["ref"], interaction: Props["interaction"]): boolean {
  const { imgRef, transform, setTransform } = interaction;
  const [isRelocating, setIsRelocating] = useState(false);
  const relocationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a live ref to transform to avoid stale closures in imperative handle
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useImperativeHandle(
    ref,
    () => ({
      centerOn(xCoord: number, yCoord: number) {
        const img = imgRef.current;
        if (!img) return;
        const scale = transformRef.current.scale;
        const offsetX = -(xCoord - 0.5) * img.offsetWidth * scale;
        const offsetY = -(yCoord - 0.5) * img.offsetHeight * scale;

        if (relocationTimerRef.current) {
          clearTimeout(relocationTimerRef.current);
        }
        setIsRelocating(true);
        setTransform((prev) => ({ ...prev, offsetX, offsetY }));
        relocationTimerRef.current = setTimeout(() => {
          setIsRelocating(false);
          relocationTimerRef.current = null;
        }, RELOCATION_DURATION_MS);
      },
    }),
    [imgRef, setTransform],
  );

  useEffect(() => {
    return () => {
      if (relocationTimerRef.current) {
        clearTimeout(relocationTimerRef.current);
      }
    };
  }, []);

  return isRelocating;
}

function useCanvasWheel(interaction: Props["interaction"]): void {
  const { containerRef, handleWheel } = interaction;
  // 用 ref-based listener 替代 React onWheel，因为需要 { passive: false } 来支持 preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel, containerRef]);
}

function panWithKeyboard(
  event: ReactKeyboardEvent<HTMLDivElement>,
  setTransform: Props["interaction"]["setTransform"],
): void {
  const offsets: Partial<Record<string, { x: number; y: number }>> = {
    ArrowLeft: { x: 24, y: 0 },
    ArrowRight: { x: -24, y: 0 },
    ArrowUp: { x: 0, y: 24 },
    ArrowDown: { x: 0, y: -24 },
  };
  const offset = offsets[event.key];
  if (!offset) return;
  event.preventDefault();
  setTransform((previous) => ({
    ...previous,
    offsetX: previous.offsetX + offset.x,
    offsetY: previous.offsetY + offset.y,
  }));
}

export function PageCanvas({
  overlay,
  empty = "暂无图片",
  onImageError,
  imageSrc,
  isLoading,
  interaction,
  onImageLoad,
  ref,
}: Props): ReactElement {
  const {
    containerRef,
    imgRef,
    transform,
    setTransform,
    containerSize,
    isPanning,
    handleCanvasMouseDown,
    handleContextMenu,
  } = interaction;

  const isRelocating = useCanvasRelocation(ref, interaction);
  useCanvasWheel(interaction);

  function handleCanvasKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    panWithKeyboard(event, setTransform);
  }

  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- the canvas uses an application role with arrow-key panning for its pointer and touch controls. */
  return (
    <div
      ref={containerRef}
      role="application"
      tabIndex={0}
      aria-label="图像标记画布，使用方向键平移"
      className={clsx(
        "relative w-full h-full overflow-hidden bg-surface-stone-600 touch-none select-none",
        isPanning ? "cursor-grabbing" : "cursor-default",
      )}
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={handleContextMenu}
      onKeyDown={handleCanvasKeyDown}
    >
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <LoadingCircle />
        </div>
      ) : imageSrc ? (
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center pointer-events-none",
            isRelocating && [
              "transition-transform duration-200 ease-out",
              "motion-reduce:transition-none",
            ],
          )}
          style={{
            transform: `translate(${String(transform.offsetX)}px, ${String(transform.offsetY)}px)`,
          }}
        >
          <div
            className="relative inline-block pointer-events-auto"
            style={{
              transform: `scale(${String(transform.scale)})`,
              transformOrigin: "center center",
            }}
          >
            <PageImage
              imageRef={imgRef}
              source={imageSrc}
              onLoad={onImageLoad}
              onError={onImageError}
              maxWidth={containerSize.w * 0.9}
              maxHeight={containerSize.h * 0.95}
            />

            {typeof overlay === "function" ? overlay(transform.scale) : overlay}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
          {empty}
        </div>
      )}
    </div>
  );
  /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
}
