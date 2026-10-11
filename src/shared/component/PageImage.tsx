import { useLayoutEffect, useRef } from "react";
import type { ReactElement, RefObject } from "react";
import type { PageImageSource } from "@/shared/utility/page-geometry";

type Props = {
  source: PageImageSource;
  imageRef: RefObject<HTMLImageElement | HTMLCanvasElement | null>;
  maxWidth: number;
  maxHeight: number;
  onLoad?: (() => void) | undefined;
  onError?: (() => void) | undefined;
};

// A decoded page owns its canvas. Mount that same surface without copying its pixels.
// Detaching preserves it for React remounts; the page's dispose releases its storage.
export function PageImage({
  source,
  imageRef,
  maxWidth,
  maxHeight,
  onLoad,
  onError,
}: Props): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (typeof source === "string") return;
    const host = hostRef.current;
    if (!host) return;
    source.setAttribute("aria-hidden", "true");
    host.appendChild(source);
    imageRef.current = source;
    return () => {
      source.remove();
      if (imageRef.current === source) imageRef.current = null;
    };
  }, [source, imageRef]);
  useLayoutEffect(() => {
    if (typeof source === "string") return;
    const canvas = hostRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.className = "select-none shadow-md";
    canvas.style.maxWidth = `${String(maxWidth)}px`;
    canvas.style.maxHeight = `${String(maxHeight)}px`;
    canvas.style.width = "auto";
    canvas.style.height = "auto";
  }, [source, maxWidth, maxHeight]);
  if (typeof source !== "string") return <div ref={hostRef} className="contents" />;
  return (
    <img
      ref={(element) => {
        imageRef.current = element;
      }}
      src={source}
      alt=""
      draggable={false}
      onLoad={onLoad}
      onError={onError}
      className="select-none shadow-md"
      style={{ maxWidth, maxHeight, width: "auto", height: "auto" }}
    />
  );
}
