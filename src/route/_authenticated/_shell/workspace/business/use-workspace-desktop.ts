import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 48rem)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
  };
}

function isDesktop(): boolean {
  return window.matchMedia(desktopQuery).matches;
}

export function useWorkspaceDesktop(): boolean {
  return useSyncExternalStore(subscribe, isDesktop);
}
