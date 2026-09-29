import type { ReactPortal } from "react";
import { createPortal } from "react-dom";
import { SpecialCharsBar } from "@/route/_authenticated/translator/business/unit-list/SpecialCharsBar";
import type { SpecialCharsBarController } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";

type Props = {
  controller: SpecialCharsBarController;
  isDisabled: boolean;
  onInsert: (char: string) => void;
};

export function FloatingSpecialCharsBar({
  controller,
  isDisabled,
  onInsert,
}: Props): ReactPortal | null {
  const { position, floatingRef } = controller;
  if (!position) return null;

  return createPortal(
    <div
      ref={floatingRef}
      className="fixed z-45"
      style={{ left: position.x, top: position.y, width: position.width }}
    >
      <SpecialCharsBar
        controller={controller}
        isFloating
        isDisabled={isDisabled}
        onInsert={onInsert}
      />
    </div>,
    document.body,
  );
}
