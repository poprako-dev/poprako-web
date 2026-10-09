import { useEffect, useLayoutEffect, useRef } from "react";
import { shouldIgnoreWorkbenchKey } from "@/shared/utility/keyboard-scope";
import {
  type ConfigurableShortcut,
  isShortcutMatch as matchesShortcut,
  type ShortcutAction,
} from "@/shared/utility/shortcut";

type ActionMap = Partial<Record<ShortcutAction, () => void>>;

export function useShortcutActions(
  actions: ActionMap,
  shortcuts: ConfigurableShortcut[],
  isDisabled: boolean,
  editableShortcutSelector?: string,
): void {
  const actionsRef = useRef(actions);
  useLayoutEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    if (isDisabled) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (shouldIgnoreWorkbenchKey(e, editableShortcutSelector)) return;
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
  }, [shortcuts, isDisabled, editableShortcutSelector]);
}
