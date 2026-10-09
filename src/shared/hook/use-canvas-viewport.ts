import type { PageImageSource } from "@/shared/utility/page-geometry";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.08;

export type Transform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type Args = {
  imageSrc: PageImageSource | null;
};

export function useCanvasViewport({ imageSrc }: Args): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  imgRef: React.RefObject<HTMLImageElement | HTMLCanvasElement | null>;
  transform: Transform;
  setTransform: React.Dispatch<React.SetStateAction<Transform>>;
  containerSize: { w: number; h: number };
  handleWheel: (e: WheelEvent) => void;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect -- reset transform when the image source changes.
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [imageSrc]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let resizeFrame: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        setContainerSize({ w: width, h: height });
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    };
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const imgRect = img.getBoundingClientRect();
    if (
      e.clientX < imgRect.left ||
      e.clientX > imgRect.right ||
      e.clientY < imgRect.top ||
      e.clientY > imgRect.bottom
    ) {
      return;
    }

    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = 1 + ZOOM_STEP * direction;

    setTransform((previous) => {
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, previous.scale * factor));
      if (scale === previous.scale) return previous;

      const actualFactor = scale / previous.scale;
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      const centerY = containerRect.top + containerRect.height / 2;
      const mouseRelX = e.clientX - centerX - previous.offsetX;
      const mouseRelY = e.clientY - centerY - previous.offsetY;

      return {
        scale,
        offsetX: previous.offsetX - mouseRelX * (actualFactor - 1),
        offsetY: previous.offsetY - mouseRelY * (actualFactor - 1),
      };
    });
  }, []);

  return {
    containerRef,
    imgRef,
    transform,
    setTransform,
    containerSize,
    handleWheel,
  };
}
