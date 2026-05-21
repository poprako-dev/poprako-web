import { useEffect, useLayoutEffect, useRef } from "react";
import {
  type ConfigurableShortcut,
  type ShortcutAction,
  matchesShortcut,
} from "@/features/BaseTranslator/features/ShortcutPanel";

type ActionMap = Partial<Record<ShortcutAction, () => void>>;

export function useShortcutActions(
  actions: ActionMap,
  shortcuts: ConfigurableShortcut[],
  disabled: boolean,
) {
  const actionsRef = useRef(actions);
  useLayoutEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut.keys)) {
          e.preventDefault();
          actionsRef.current[shortcut.action]?.();
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, disabled]);
}
