import { useRef, useState } from "react";

const STORAGE_KEY = "translator:relocation-enabled";

type RelocationStorage = Pick<Storage, "getItem" | "setItem">;

function getStorage(): RelocationStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function isRelocationPreferenceEnabled(
  storage: RelocationStorage | null = getStorage(),
): boolean {
  try {
    return storage?.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveRelocationPreference(
  isEnabled: boolean,
  storage: RelocationStorage | null = getStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, String(isEnabled));
  } catch {
    // Keep the current-session preference when browser storage is unavailable.
  }
}

export function useRelocationPreference(): {
  isRelocationEnabled: boolean;
  toggleRelocation: () => void;
} {
  const [isRelocationEnabled, setIsRelocationEnabled] = useState(isRelocationPreferenceEnabled);
  const enabledRef = useRef(isRelocationEnabled);

  function toggleRelocation(): void {
    const isNext = !enabledRef.current;
    enabledRef.current = isNext;
    setIsRelocationEnabled(isNext);
    saveRelocationPreference(isNext);
  }

  return { isRelocationEnabled, toggleRelocation };
}
