import { useEffect, useLayoutEffect, useRef } from "react";
import { shouldIgnoreTranslatorKey } from "@/routes/_authenticated/translator/business/editor/keyboard-scope";
import {
  type ConfigurableShortcut,
  isShortcutMatch as matchesShortcut,
  type ShortcutAction,
} from "@/routes/_authenticated/translator/business/shortcut/base-translator-type";

type ActionMap = Partial<Record<ShortcutAction, () => void>>;

export function useShortcutActions(
  actions: ActionMap,
  shortcuts: ConfigurableShortcut[],
  isDisabled: boolean,
): void {
  const actionsRef = useRef(actions);
  useLayoutEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    if (isDisabled) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (shouldIgnoreTranslatorKey(e)) return;
      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut.keys)) {
          e.preventDefault();
          actionsRef.current[shortcut.action]?.();
          return;
        }
      }
    }

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, isDisabled]);
}
