import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { usePreparedModeSwitch } from "./use-prepared-mode-switch";
import type { TranslatorMode } from "../unit/translator-mode";

export type TranslatorViewState = {
  entryMode: TranslatorMode;
  view: TranslatorMode;
};

export function useExternalModeTransition(
  current: TranslatorViewState,
  mode: TranslatorMode,
  availableModes: TranslatorMode[],
  setViewState: Dispatch<SetStateAction<TranslatorViewState>>,
): void {
  const target =
    current.entryMode !== mode || !availableModes.includes(current.view) ? mode : undefined;
  const request = usePreparedModeSwitch({
    currentView: current.view,
    nextView: target,
    commit: () => {
      setViewState({ entryMode: mode, view: mode });
    },
  });
  const requestRef = useRef(request);
  useEffect(() => {
    requestRef.current = request;
  });
  useEffect(() => {
    if (target) requestRef.current();
  }, [current.entryMode, current.view, target]);
}
