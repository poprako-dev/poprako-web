import { afterEach, expect, test, vi } from "vitest";
import type { UnitInfo } from "../unit/unit";
import { createUnitSaveFixture } from "../test/unit-save-fixture";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createDraftStore } from "./draft-store";
import { type UnitSaveController, createUnitSaveController } from "./unit-save-controller";
import { UnitSaveCatalog } from "./unit-save-catalog";
import * as identity from "./unit-identity";
import * as diff from "./unit-diff";
import { replayEdits } from "./draft-sequence";

function units(): UnitInfo[] {
  return Array.from({ length: 100 }, (_, index) => ({
    id: `local-${String(index)}`,
    index,
    xCoord: 0,
    yCoord: 0,
    isBubble: true,
    isFlagged: false,
    isProofread: false,
  }));
}

function setup(initial: UnitInfo[]): {
  controller: UnitSaveController;
  pages: Map<string, UnitInfo[]>;
} {
  const pages = new Map([["p", initial]]);
  const controller = createUnitSaveController({
    save: createUnitSaveFixture(pages),
    reload: (id) => Promise.resolve(pages.get(id) ?? []),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  controller.load("p", initial);
  return { controller, pages };
}

afterEach(() => {
  vi.restoreAllMocks();
});

test("100 proofreading changes share one identity index; saving adds three bounded indexes", async () => {
  const { controller } = setup(units());
  const resolve = vi.spyOn(identity, "unitIdentityResolver");
  controller.commit(controller.getSnapshot().units.map((unit) => ({ ...unit, isProofread: true })));
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(resolve.mock.calls[0]?.[1]).toHaveLength(200);
  resolve.mockClear();
  await controller.flush();
  expect(resolve).toHaveBeenCalledTimes(3);
  expect(resolve.mock.calls.reduce((sum, call) => sum + (call[1]?.length ?? 0), 0)).toBe(800);
  expect(controller.getSnapshot().dirty).toBe(false);
});

test("saving 100 creations builds three indexes scanning 700 preferred entries", async () => {
  const { controller, pages } = setup([]);
  controller.commit(units());
  const resolve = vi.spyOn(identity, "unitIdentityResolver");
  await controller.flush();
  expect(resolve).toHaveBeenCalledTimes(3);
  expect(resolve.mock.calls.reduce((sum, call) => sum + (call[1]?.length ?? 0), 0)).toBe(700);
  expect(controller.getSnapshot().units.map((unit) => unit.id)).toEqual(
    units().map((unit) => unit.id),
  );
  expect(pages.get("p")).toHaveLength(100);
  expect(pages.get("p")?.[0]?.id).not.toBe("local-0");
});

test("replaying 100 creations resolves IDs and anchors once outside comparison loops", () => {
  const target = units();
  const edits = diff.buildUnitDiff(target, []);
  const resolve = vi.fn((id: string) => id);
  expect(replayEdits([], edits, target, resolve)).toEqual(target);
  expect(resolve).toHaveBeenCalledTimes(399);
});

test("typing shares unchanged units without cloning a page and clearHistory only publishes status", async () => {
  const drafts = createDraftStore("u", "c", createDraftDatabaseFixture());
  await drafts.ready;
  const controller = createUnitSaveController({
    drafts,
    save: vi.fn(),
    reload: () => Promise.resolve([]),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  controller.load("p", units());
  const before = controller.getSnapshot().units;
  const clone = vi.spyOn(globalThis, "structuredClone");
  controller.commit(before.map((unit, index) => (index ? unit : { ...unit, translatedText: "a" })));
  expect(clone).not.toHaveBeenCalled();
  const record = drafts.getState().drafts["p"];
  expect(record?.units).toBe(controller.getSnapshot().units);
  expect(record?.units[1]).toBe(before[1]);
  const resolve = vi.spyOn(identity, "unitIdentityResolver");
  const build = vi.spyOn(diff, "buildUnitDiff");
  const project = vi.spyOn(UnitSaveCatalog.prototype, "project");
  const retain = vi.spyOn(drafts, "retain");
  controller.clearHistory();
  expect(resolve).not.toHaveBeenCalled();
  expect(clone).not.toHaveBeenCalled();
  expect(build).not.toHaveBeenCalled();
  expect(project).not.toHaveBeenCalled();
  expect(retain).not.toHaveBeenCalled();
  expect(drafts.getState().drafts["p"]).toBe(record);
  expect(controller.getSnapshot().canUndo).toBe(false);
});
