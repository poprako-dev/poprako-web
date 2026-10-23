import { TranslateModeUnitItem } from "../unit-list/TranslateModeUnitItem";
import { ProofreadModeUnitItem } from "../unit-list/ProofreadModeUnitItem";
import type { UnitItemComponent } from "../unit-list/UnitListItem";
import type { TranslatorMode } from "../unit/translator-mode";

export { EditorDialog as Dialog } from "./EditorDialog";
export { EditingTerminologyBar as TerminologyBar } from "./EditingTerminologyBar";

export function unitItemComponent(mode: TranslatorMode): UnitItemComponent {
  return mode === "translate" ? TranslateModeUnitItem : ProofreadModeUnitItem;
}
