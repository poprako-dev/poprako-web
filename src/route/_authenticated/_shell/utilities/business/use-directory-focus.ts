import { useLayoutEffect, useRef, type RefObject } from "react";

export function useDirectoryFocus(
  level: "termbases" | "terms",
  active: boolean,
): RefObject<HTMLElement | null> {
  const sectionRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!active) return;
    const selector =
      level === "termbases"
        ? 'input[placeholder="搜索术语库名称"]'
        : 'button[aria-label="返回术语库"]';
    sectionRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  }, [level, active]);
  return sectionRef;
}
