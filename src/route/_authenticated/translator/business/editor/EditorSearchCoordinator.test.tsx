import { type RenderHookResult, act, renderHook } from "@testing-library/react";
import { type Mock, describe, expect, it, vi } from "vitest";
import { useUnitPersistence } from "../persistence/use-unit-persistence";
import { createEditorSearchCoordinator } from "./editor-search-coordinator";
import { createUnitSaveFixture } from "../test/unit-save-fixture";
import type { UnitInfo } from "../unit/unit";

const unit: UnitInfo = {
  id: "unit-1",
  index: 0,
  xCoord: 0.2,
  yCoord: 0.3,
  isBubble: true,
  isFlagged: false,
  isProofread: false,
  translatedText: "旧词",
};

type Context = {
  persistence: RenderHookResult<ReturnType<typeof useUnitPersistence>, unknown>;
  coordinator: ReturnType<typeof createEditorSearchCoordinator>;
  save: Mock<ReturnType<typeof createUnitSaveFixture>>;
  reload: Mock<(pageId: string) => Promise<UnitInfo[]>>;
  loadPage: Mock<() => Promise<void>>;
  search: Mock<() => Promise<{ success: true; data: { pageId: string; unit: UnitInfo }[] }>>;
  transform: Mock<() => Promise<{ success: true; data: undefined }>>;
  showToast: Mock;
};

function setup(): Context {
  const pages = new Map([["page-1", [unit]]]);
  const save = vi.fn(createUnitSaveFixture(pages));
  const reload = vi.fn((pageId: string) => Promise.resolve(pages.get(pageId) ?? []));
  const loadPage = vi.fn(() => Promise.resolve());
  const showToast = vi.fn();
  const persistence = renderHook(() =>
    useUnitPersistence({
      onSaveUnits: save,
      onReloadUnits: reload,
      onExit: vi.fn(),
      showToast,
      loadPage,
      setUnitBuf: vi.fn(),
      autoSaveEnabled: false,
    }),
  );
  act(() => {
    persistence.result.current.setLoadedUnits("page-1", [unit]);
  });
  const search = vi.fn(() =>
    Promise.resolve({ success: true as const, data: [{ pageId: "page-1", unit }] }),
  );
  const transform = vi.fn(() => Promise.resolve({ success: true as const, data: undefined }));
  const coordinator = createEditorSearchCoordinator({
    dataSource: { search, transform, reloadPage: vi.fn() },
    part: "translatedText",
    currentPageId: "page-1",
    flush: () => persistence.result.current.flushIfDirty(false),
    runExclusive: (operation) => persistence.result.current.runExclusive(operation),
    refreshCurrentPage: () => persistence.result.current.refreshUnits(),
    navigate: (_pageId, unitId) => persistence.result.current.handleNavigate(1, unitId),
  });
  return { persistence, coordinator, save, reload, loadPage, search, transform, showToast };
}

describe("编辑搜索协调", () => {
  it("保存失败保留草稿并阻止搜索，重试保存后才搜索", async () => {
    const context = setup();
    const failure = new Error("保存中断");
    context.save.mockRejectedValueOnce(failure);
    act(() => {
      context.persistence.result.current.commitUnits([{ ...unit, isFlagged: true }]);
    });
    await act(async () => {
      expect(await context.coordinator.search(" 旧词 ")).toEqual({
        success: false,
        error: "当前页保存失败，未执行搜索",
      });
    });
    expect(context.search).not.toHaveBeenCalled();
    expect(context.persistence.result.current.saveState.dirty).toBe(true);
    await act(async () => {
      expect(await context.coordinator.search(" 旧词 ")).toEqual({
        success: true,
        data: { matches: [{ pageId: "page-1", unit }], phrase: "旧词" },
      });
    });
    expect(context.search).toHaveBeenCalledWith({ part: "translatedText", phrase: "旧词" });
    expect(context.persistence.result.current.saveState.dirty).toBe(false);
  });
});

describe("编辑搜索协调", () => {
  it("替换等待期间导航互斥，刷新完成后导航恢复", async () => {
    const context = setup();
    let resolveTransform: (() => void) | undefined;
    context.transform.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveTransform = () => {
            resolve({ success: true, data: undefined });
          };
        }),
    );
    let operation: Promise<unknown> | undefined;
    await act(async () => {
      operation = context.coordinator.transform("旧词", "新词", [{ pageId: "page-1", unit }]);
      await Promise.resolve();
    });
    expect(context.transform).toHaveBeenCalledOnce();
    await act(() => context.coordinator.navigate("page-2", "unit-2"));
    expect(context.loadPage).not.toHaveBeenCalled();
    await act(async () => {
      resolveTransform?.();
      await operation;
    });
    expect(context.reload).toHaveBeenCalledWith("page-1");
    await act(() => context.coordinator.navigate("page-2", "unit-2"));
    expect(context.loadPage).toHaveBeenCalledWith(1, "unit-2");
  });
});

describe("编辑搜索协调", () => {
  it("替换成功但当前页刷新失败，明确返回恢复状态并允许重新搜索", async () => {
    const context = setup();
    context.reload.mockRejectedValueOnce(new Error("刷新中断"));
    await act(async () => {
      expect(
        await context.coordinator.transform("旧词", "新词", [{ pageId: "page-1", unit }]),
      ).toEqual({ status: "refresh-failed" });
    });
    expect(context.transform).toHaveBeenCalledOnce();
    expect(context.persistence.result.current.saveState.refreshError).toBe(true);
    await act(async () => {
      expect((await context.coordinator.search("旧词")).success).toBe(true);
    });
    expect(context.transform).toHaveBeenCalledOnce();
    expect(context.persistence.result.current.saveState.refreshError).toBe(false);
  });
});

describe("编辑搜索协调", () => {
  it("只替换其他页时不刷新当前草稿，搜索刷新失败仍报告替换已完成", async () => {
    const context = setup();
    context.search.mockRejectedValueOnce(new Error("搜索中断"));
    await act(async () => {
      expect(
        await context.coordinator.transform("旧词", "新词", [{ pageId: "page-2", unit }]),
      ).toEqual({ status: "refresh-failed" });
    });
    expect(context.reload).not.toHaveBeenCalled();
    expect(context.transform).toHaveBeenCalledWith({
      part: "translatedText",
      origin: "旧词",
      target: "新词",
      unitIds: ["unit-1"],
    });
  });
});
