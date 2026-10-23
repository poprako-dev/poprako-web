import { useEffect, useRef } from "react";

/** Let React's composition-end handler submit the preview before replacing input rows. */
export function useCompositionBarrier(): (commit: () => void) => void {
  const composingRef = useRef(false);
  const queuedRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let active = true;
    function start(): void {
      composingRef.current = true;
    }
    function end(): void {
      composingRef.current = false;
      queueMicrotask(() => {
        if (!active || composingRef.current) return;
        const commit = queuedRef.current;
        queuedRef.current = null;
        commit?.();
      });
    }
    document.addEventListener("compositionstart", start, true);
    document.addEventListener("compositionend", end, true);
    return () => {
      active = false;
      queuedRef.current = null;
      document.removeEventListener("compositionstart", start, true);
      document.removeEventListener("compositionend", end, true);
    };
  }, []);
  return (commit) => {
    if (composingRef.current) queuedRef.current = commit;
    else commit();
  };
}
