import type { UnitSaveController, UnitSaveControllerOptions } from "./save-controller-type";
import { UnitSaveControllerRuntime } from "./unit-save-controller-runtime";
export type { SaveSnapshot, UnitSaveController } from "./save-controller-type";
export { LocalDraftSavedError } from "./local-draft-saved-error";

type Options = UnitSaveControllerOptions;

export function createUnitSaveController(options: Options): UnitSaveController {
  const runtime = new UnitSaveControllerRuntime(options);
  return {
    load: runtime.load.bind(runtime),
    commit: runtime.commit.bind(runtime),
    undo: runtime.undo.bind(runtime),
    clearHistory: runtime.clearHistory.bind(runtime),
    saveOnce: runtime.saveOnce.bind(runtime),
    flush: runtime.flush.bind(runtime),
    refresh: runtime.refresh.bind(runtime),
    retryRecovery: runtime.retryRecovery.bind(runtime),
    getSnapshot: runtime.getSnapshot.bind(runtime),
    getPageId: runtime.getPageId.bind(runtime),
    setSuspended: runtime.setSuspended.bind(runtime),
    setActive: runtime.setActive.bind(runtime),
  };
}
