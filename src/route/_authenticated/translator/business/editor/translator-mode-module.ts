import { createModuleResource } from "@/shared/utility/module-resource";
import type { ModuleResource } from "@/shared/utility/module-resource";
import type { TranslatorModeModule } from "./mode-props";
import type { TranslatorMode } from "../unit/translator-mode";

const editingModeModule = createModuleResource<TranslatorModeModule>(
  () => import("./editing-mode"),
);
const readOnlyModeModule = createModuleResource(() => import("./read-only-mode"));

export function translatorModeModule(mode: TranslatorMode): ModuleResource<TranslatorModeModule> {
  return mode === "readOnly" ? readOnlyModeModule : editingModeModule;
}

export function preloadTranslatorMode(mode: TranslatorMode): Promise<unknown> {
  return translatorModeModule(mode).load();
}
