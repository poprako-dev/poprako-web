import { useRef, useState } from "react";

const STORAGE_KEY = "translator:relocation-enabled";

type RelocationStorage = Pick<Storage, "getItem" | "setItem">;

function getStorage(): RelocationStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadRelocationPreference(
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
) {
  try {
    storage?.setItem(STORAGE_KEY, String(isEnabled));
  } catch {
    // Keep the current-session preference when browser storage is unavailable.
  }
}

export function useRelocationPreference() {
  const [isRelocationEnabled, setIsRelocationEnabled] = useState(
    loadRelocationPreference,
  );
  const enabledRef = useRef(isRelocationEnabled);

  function toggleRelocation() {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setIsRelocationEnabled(next);
    saveRelocationPreference(next);
  }

  return { isRelocationEnabled, toggleRelocation };
}
