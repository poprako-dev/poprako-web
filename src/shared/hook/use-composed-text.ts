import { useLayoutEffect, useRef, useState } from "react";

/** Keep IME previews out of both undo history and automatic saves. */
export function useComposedText(
  value: string,
  onChange: (value: string) => void,
): {
  value: string;
  change: (next: string) => void;
  start: () => void;
  end: (next: string) => void;
} {
  const composingRef = useRef(false);
  const submittedRef = useRef(value);
  const [preview, setPreview] = useState<string | null>(null);
  useLayoutEffect(() => {
    submittedRef.current = value;
  }, [value]);

  function submit(next: string): void {
    if (submittedRef.current === next) return;
    submittedRef.current = next;
    onChange(next);
  }

  return {
    value: preview ?? value,
    change: (next) => {
      if (composingRef.current) setPreview(next);
      else submit(next);
    },
    start: () => {
      composingRef.current = true;
      setPreview(value);
    },
    end: (next) => {
      composingRef.current = false;
      setPreview(null);
      submit(next);
    },
  };
}
