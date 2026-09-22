import { useEffect, useLayoutEffect, useRef } from "react";
import { shouldIgnoreTranslatorKey } from "./keyboardScope";
/* eslint-disable @eslint-react/web-api-no-leaked-event-listener -- cleanup is paired below. */
import {
  type ConfigurableShortcut,
  type ShortcutAction,
  matchesShortcut,
} from "@/features/BaseTranslator/features/ShortcutPanel";

type ActionMap = Partial<Record<ShortcutAction, () => void>>;

export function useShortcutActions(
  actions: ActionMap,
  shortcuts: ConfigurableShortcut[],
  isDisabled: boolean,
) {
  const actionsRef = useRef(actions);
  useLayoutEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    if (isDisabled) {return;}

    function handleKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreTranslatorKey(e)) {return;}
      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut.keys)) {
          e.preventDefault();
          actionsRef.current[shortcut.action]?.();
          return;
        }
      }
    }

    addEventListener("keydown", handleKeyDown);
    return () => {
      removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, isDisabled]);
}
