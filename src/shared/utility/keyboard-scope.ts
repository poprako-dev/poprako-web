import { isKeyboardComposing } from "@/shared/utility/keyboard";

export function shouldIgnoreWorkbenchKey(
  event: KeyboardEvent,
  editableShortcutSelector?: string,
): boolean {
  if (event.defaultPrevented || isKeyboardComposing(event)) return true;

  const target = event.composedPath().find((node) => node instanceof Element) ?? event.target;
  if (!(target instanceof Element)) return false;
  if (
    target.closest(
      '[data-app-dialog], [role="dialog"], [role="alertdialog"], [data-translator-shortcuts="ignore"], [data-workbench-shortcuts="ignore"]',
    )
  ) {
    return true;
  }

  const isEditable =
    target.closest("input, textarea, select") !== null ||
    (target instanceof HTMLElement && target.isContentEditable);
  return isEditable && (!editableShortcutSelector || !target.closest(editableShortcutSelector));
}
