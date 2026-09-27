import { createPortal } from "react-dom";
import SpecialCharsBar from "../../features/UnitList/components/business/SpecialCharsBar";
import type { SpecialCharsBarController } from "../../hook/useDetachableSpecialCharsBar";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Component props.
type Props = {
  controller: SpecialCharsBarController;
  isDisabled: boolean;
  onInsert: (char: string) => void;
};

export default function FloatingSpecialCharsBar({ controller, isDisabled, onInsert }: Props) {
  const { position, floatingRef } = controller;
  if (!position) {return null;}

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
