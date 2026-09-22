import { isKeyboardComposing } from "@/lib/keyboard";

export function shouldIgnoreTranslatorKey(event: KeyboardEvent) {
  if (event.defaultPrevented || isKeyboardComposing(event)) {return true;}

  const target = event.composedPath().find((node) => node instanceof Element) ?? event.target;
  if (!(target instanceof Element)) {return false;}
  if (target.closest('[data-app-dialog], [role="dialog"], [role="alertdialog"]')) {
    return true;
  }

  const isEditable = target.closest("input, textarea, select") !== null
    || (target instanceof HTMLElement && target.isContentEditable);
  return isEditable && !target.closest("[data-unit-id]");
}
