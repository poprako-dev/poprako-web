import type { TranslatorMode } from "@/types/translatorMode";

type TranslatorCapabilities = {
  canTranslate: boolean;
  canProofread: boolean;
};

export type TranslatorCompletionStage = "translate" | "proofread";

export function translatorCompletionStage({
  canTranslate,
  canProofread,
}: TranslatorCapabilities): TranslatorCompletionStage | undefined {
  if (canProofread) return "proofread";
  if (canTranslate) return "translate";
  return undefined;
}

export function availableTranslatorModes({
  canTranslate,
  canProofread,
}: TranslatorCapabilities): TranslatorMode[] {
  const modes: TranslatorMode[] = [];

  if (canTranslate) modes.push("translate");
  if (canProofread) modes.push("proofread");

  return modes.length > 0 ? modes : ["readOnly"];
}

export function initialTranslatorMode(
  availableModes: TranslatorMode[],
  requestedMode?: TranslatorMode,
): TranslatorMode {
  if (requestedMode === "readOnly") return "readOnly";

  return requestedMode && availableModes.includes(requestedMode)
    ? requestedMode
    : availableModes[0];
}

export function nextTranslatorMode(
  currentMode: TranslatorMode,
  availableModes: TranslatorMode[],
): TranslatorMode {
  const currentIndex = availableModes.indexOf(currentMode);
  return availableModes[(currentIndex + 1) % availableModes.length];
}
