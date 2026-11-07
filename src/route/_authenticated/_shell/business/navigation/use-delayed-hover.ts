import { useCallback, useEffect, useRef, useState } from "react";

type DelayedHover = {
  isHovered: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
};

/** 指针停留满 delayMs 后才视为悬停，避免快速掠过时触发。 */
export function useDelayedHover(delayMs: number): DelayedHover {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const handleMouseEnter = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setIsHovered(true);
    }, delayMs);
  }, [clearTimer, delayMs]);

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    setIsHovered(false);
  }, [clearTimer]);

  return { isHovered, handleMouseEnter, handleMouseLeave };
}
