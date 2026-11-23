import { useRef, useState } from "react";

const STORAGE_KEY = "translator:auto-focus-on-create";

type AutoFocusStorage = Pick<Storage, "getItem" | "setItem">;

function getStorage(): AutoFocusStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function isAutoFocusPreferenceEnabled(
  storage: AutoFocusStorage | null = getStorage(),
): boolean {
  try {
    return storage?.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function saveAutoFocusPreference(
  isEnabled: boolean,
  storage: AutoFocusStorage | null = getStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, String(isEnabled));
  } catch {
    // Keep the current-session preference when browser storage is unavailable.
  }
}

export function useAutoFocusPreference(): {
  isAutoFocusOnCreate: boolean;
  toggleAutoFocusOnCreate: () => void;
} {
  const [isAutoFocusOnCreate, setIsAutoFocusOnCreate] = useState(isAutoFocusPreferenceEnabled);
  const enabledRef = useRef(isAutoFocusOnCreate);

  function toggleAutoFocusOnCreate(): void {
    const isNext = !enabledRef.current;
    enabledRef.current = isNext;
    setIsAutoFocusOnCreate(isNext);
    saveAutoFocusPreference(isNext);
  }

  return { isAutoFocusOnCreate, toggleAutoFocusOnCreate };
}
