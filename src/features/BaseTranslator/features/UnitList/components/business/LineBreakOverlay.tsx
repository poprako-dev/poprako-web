import { useLayoutEffect, useRef, useState, type RefObject } from "react";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Props convention.
type Props = {
  targetRef: RefObject<HTMLDivElement | null>;
  layoutKey: readonly unknown[];
};

interface MarkerPosition {
  offset: number;
  left: number;
  top: number;
  height: number;
}

export default function LineBreakOverlay({ targetRef, layoutKey }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<MarkerPosition[]>([]);

  useLayoutEffect(() => {
    const target = targetRef.current;
    const overlay = overlayRef.current;
    if (!target || !overlay) {return;}
    let isDisposed = false;

    const measure = () => {
      if (isDisposed) {return;}
      const origin = overlay.getBoundingClientRect();
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      const next: MarkerPosition[] = [];
      let offset = 0;
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? "";
        for (const match of text.matchAll(/\n/gu)) {
          range.setStart(node, match.index);
          range.setEnd(node, match.index + 1);
          const rect = range.getBoundingClientRect();
          next.push({
            offset: offset + match.index,
            left: rect.left - origin.left,
            top: rect.top - origin.top,
            height: rect.height,
          });
        }
        offset += text.length;
        node = walker.nextNode();
      }
      // eslint-disable-next-line @eslint-react/set-state-in-effect -- Measure DOM before paint.
      setPositions(next);
    };

    // Measure the rendered text before paint; markers never enter the text flow.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    if (document.fonts.status === "loading") {void document.fonts.ready.then(measure);}
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      isDisposed = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [targetRef, layoutKey]);

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
          className={
            "absolute font-normal text-stone-400 after:content-['↵']"
          }
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
