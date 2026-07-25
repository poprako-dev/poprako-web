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

  // 校对优先：同时拥有翻译和校对身份时，进入的是校对模式；翻译仅作为可切换视图。
  if (canProofread) modes.push("proofread");
  else if (canTranslate) modes.push("translate");

  return modes.length > 0 ? modes : ["readOnly"];
}

export function initialTranslatorMode(
  availableModes: TranslatorMode[],
  requestedMode?: TranslatorMode,
): TranslatorMode {
  if (requestedMode === "readOnly") return "readOnly";

  return availableModes[0];
}
