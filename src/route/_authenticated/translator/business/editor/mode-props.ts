import type { ComponentType } from "react";
import type { EditorSession } from "./use-editor-session";
import type { UnitItemComponent } from "../unit-list/UnitListItem";
import type { TranslatorMode } from "../unit/translator-mode";

export type TranslatorModeProps = {
  session: EditorSession;
};

export type TranslatorModeModule = {
  unitItemComponent: (mode: TranslatorMode) => UnitItemComponent;
  Dialog?: ComponentType<TranslatorModeProps>;
  TerminologyBar?: ComponentType<TranslatorModeProps>;
};
