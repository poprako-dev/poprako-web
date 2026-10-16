import { vi } from "vitest";
import type { UnitInfo } from "../unit/unit";
import { createUnitSaveController } from "../persistence/unit-save-controller";
import { createUnitSaveFixture } from "./unit-save-fixture";

export function undoUnit(id = "u1", translatedText = ""): UnitInfo {
  return {
    id,
    index: 0,
    translatedText,
    xCoord: 0.1,
    yCoord: 0.2,
    isBubble: true,
    isFlagged: false,
    isProofread: false,
  };
}

export function createUndoFixture(initial = [undoUnit()]): {
  controller: ReturnType<typeof createUnitSaveController>;
  pages: Map<string, UnitInfo[]>;
  backend: ReturnType<typeof createUnitSaveFixture>;
  save: ReturnType<typeof vi.fn<ReturnType<typeof createUnitSaveFixture>>>;
  reload: ReturnType<typeof vi.fn<(id: string) => Promise<UnitInfo[]>>>;
} {
  const pages = new Map([["p1", initial]]);
  const backend = createUnitSaveFixture(pages);
  const save = vi.fn(backend);
  const reload = vi.fn((id: string) => Promise.resolve(pages.get(id) ?? []));
  const controller = createUnitSaveController({ save, reload, changed: vi.fn(), failed: vi.fn() });
  controller.load("p1", initial);
  return { controller, pages, backend, save, reload };
}

export function deferredUndoSave(): { promise: Promise<void>; resolve: () => void } {
  let finish: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return {
    promise,
    resolve: () => {
      finish();
    },
  };
}

export function requiredUndoUnit(units: UnitInfo[], index = 0): UnitInfo {
  const unit = units[index];
  if (!unit) throw new Error("测试 Unit 缺失");
  return unit;
}
