import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ProofreadPreviewVisibility } from "@/route/_authenticated/translator/business/contract/preview";

const STORAGE_KEY = "translator:proofread-preview-visibility";

type PreviewStorage = Pick<Storage, "getItem" | "setItem">;

function getStorage(): PreviewStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function readProofreadPreviewPreference(
  storage: PreviewStorage | null = getStorage(),
): ProofreadPreviewVisibility {
  try {
    return storage?.getItem(STORAGE_KEY) === "dimmed" ? "dimmed" : "visible";
  } catch {
    return "visible";
  }
}

export function saveProofreadPreviewPreference(
  visibility: ProofreadPreviewVisibility,
  storage: PreviewStorage | null = getStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, visibility);
  } catch {
    // Keep the current-session preference when browser storage is unavailable.
  }
}

export function useProofreadPreviewPreference(): {
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  setProofreadPreviewVisibility: Dispatch<SetStateAction<ProofreadPreviewVisibility>>;
} {
  const [visibility, setVisibility] = useState(readProofreadPreviewPreference);
  const visibilityRef = useRef(visibility);

  function setProofreadPreviewVisibility(action: SetStateAction<ProofreadPreviewVisibility>): void {
    const next = typeof action === "function" ? action(visibilityRef.current) : action;
    visibilityRef.current = next;
    setVisibility(next);
    saveProofreadPreviewPreference(next);
  }

  return { proofreadPreviewVisibility: visibility, setProofreadPreviewVisibility };
}
