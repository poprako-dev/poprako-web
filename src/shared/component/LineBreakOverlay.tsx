import { useCommittedCallback } from "@/shared/hook/use-committed-callback";
import type { JSX } from "react/jsx-runtime";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";

type Props = {
  targetRef: RefObject<HTMLDivElement | null>;
  contentKey: unknown;
  styleKey: string | boolean | undefined;
};

type MarkerPosition = {
  offset: number;
  left: number;
  top: number;
  height: number;
};

function measureLineBreakPositions(
  target: HTMLDivElement,
  overlay: HTMLDivElement,
): MarkerPosition[] {
  const origin = overlay.getBoundingClientRect();
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const positions: MarkerPosition[] = [];
  let offset = 0;
  let node = walker.nextNode();
  while (node) {
    const text = node.textContent ?? "";
    for (const match of text.matchAll(/\n/gu)) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + 1);
      const rect = range.getBoundingClientRect();
      positions.push({
        offset: offset + match.index,
        left: rect.left - origin.left,
        top: rect.top - origin.top,
        height: rect.height,
      });
    }
    offset += text.length;
    node = walker.nextNode();
  }
  return positions;
}

export function LineBreakOverlay({ targetRef, contentKey, styleKey }: Props): JSX.Element {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<MarkerPosition[]>([]);

  const measureNow = useCommittedCallback((): void => {
    const target = targetRef.current;
    const overlay = overlayRef.current;
    if (target && overlay) setPositions(measureLineBreakPositions(target, overlay));
  });
  useLayoutEffect(() => {
    measureNow();
  }, [measureNow, contentKey, styleKey]);

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    let isDisposed = false;
    let measureFrame: number | null = null;

    const scheduleMeasure = (): void => {
      if (isDisposed) return;
      if (measureFrame !== null) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = null;
        measureNow();
      });
    };

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(target);
    if (document.fonts.status === "loading") {
      void document.fonts.ready.then(scheduleMeasure);
    }
    document.fonts.addEventListener("loadingdone", scheduleMeasure);
    return () => {
      isDisposed = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", scheduleMeasure);
      if (measureFrame !== null) cancelAnimationFrame(measureFrame);
    };
  }, [targetRef, measureNow]);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
    >
      {positions.map((position) => (
        <span
          key={position.offset}
          data-line-break-marker
          className={"absolute font-normal text-text-muted-warm after:content-['↵']"}
          style={{
            left: position.left,
            top: position.top,
            height: position.height,
            lineHeight: `${String(position.height)}px`,
          }}
        />
      ))}
    </div>
  );
}
