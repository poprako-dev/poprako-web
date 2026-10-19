import { useEffect, useState } from "react";

type DirectoryLevel = "termbases" | "terms";
type Transition = { displayedLevel: DirectoryLevel; fading: boolean };

export function useDirectoryTransition(level: DirectoryLevel): Transition {
  const [displayedLevel, setDisplayedLevel] = useState(level);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function finish(): void {
      clearTimeout(timeout);
      setDisplayedLevel(level);
      setFading(false);
    }
    const frame = requestAnimationFrame(() => {
      if (media.matches || level === displayedLevel) finish();
      else {
        setFading(true);
        timeout = setTimeout(finish, 150);
      }
    });
    function onMotionChange(): void {
      if (media.matches) finish();
    }
    media.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      media.removeEventListener("change", onMotionChange);
    };
  }, [level, displayedLevel]);
  return { displayedLevel, fading };
}
