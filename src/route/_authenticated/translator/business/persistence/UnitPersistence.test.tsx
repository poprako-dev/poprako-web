import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useUnitPersistence } from "./use-unit-persistence";
import { createDraftStore } from "./draft-store";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import type { UnitInfo } from "../unit/unit";
const unit: UnitInfo = {
  id: "u",
  index: 0,
  xCoord: 0,
  yCoord: 0,
  isBubble: true,
  isFlagged: false,
  isProofread: false,
};

test("failed remote save persists translation and proofreading then automatically navigates", async () => {
  const database = createDraftDatabaseFixture();
  const drafts = createDraftStore("user", "chapter", database);
  await drafts.ready;
  const loadPage = vi.fn();
  const showToast = vi.fn();
  const boundary: { guard: (() => Promise<boolean>) | null } = { guard: null };
  const { result } = renderHook(() =>
    useUnitPersistence({
      drafts,
      onSaveUnits: vi.fn().mockRejectedValue(new Error("offline")),
      onReloadUnits: () => Promise.resolve([unit]),
      loadPage,
      onExit: vi.fn(),
      showToast,
      setUnitBuf: vi.fn(),
      autoSaveEnabled: false,
      registerLeaveGuard: (guard) => {
        boundary.guard = guard;
      },
    }),
  );
  act(() => {
    result.current.setLoadedUnits("p", [unit]);
    result.current.commitUnits([{ ...unit, translatedText: "翻译", proofreadText: "校对" }]);
  });
  await act(() => result.current.handleNavigate(1));
  expect(loadPage).toHaveBeenCalledWith(1, undefined);
  expect(showToast).toHaveBeenCalledWith("远程保存失败，已暂存为本地草稿", "error");
  const reopened = createDraftStore("user", "chapter", database);
  await reopened.ready;
  expect(reopened.getState().drafts["p"]?.units[0]).toMatchObject({
    translatedText: "翻译",
    proofreadText: "校对",
  });
  await act(async () => {
    expect(await boundary.guard?.()).toBe(false);
  });
});

test("local failure blocks exit and router navigation without clearing input", async () => {
  const database = createDraftDatabaseFixture();
  const drafts = createDraftStore("user", "chapter", database);
  await drafts.ready;
  vi.spyOn(database, "transact").mockRejectedValue(new Error("disk unavailable"));
  const onExit = vi.fn();
  const boundary: { guard: (() => Promise<boolean>) | null } = { guard: null };
  const { result } = renderHook(() =>
    useUnitPersistence({
      drafts,
      onSaveUnits: vi.fn().mockRejectedValue(new Error("offline")),
      onReloadUnits: () => Promise.resolve([unit]),
      loadPage: vi.fn(),
      onExit,
      showToast: vi.fn(),
      setUnitBuf: vi.fn(),
      autoSaveEnabled: false,
      registerLeaveGuard: (guard) => {
        boundary.guard = guard;
      },
    }),
  );
  act(() => {
    result.current.setLoadedUnits("p", [unit]);
    result.current.commitUnits([{ ...unit, translatedText: "保留" }]);
  });
  await act(() => result.current.handleExit());
  expect(onExit).not.toHaveBeenCalled();
  await act(async () => {
    expect(await boundary.guard?.()).toBe(true);
  });
  expect(result.current.unitBufRef.current[0]?.translatedText).toBe("保留");
  expect(result.current.saveState.storageError).toBeTruthy();
});
