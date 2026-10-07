import { describe, expect, it, vi } from "vitest";
import { createRevisionPageController } from "./revision-page-controller";
import type { RevisionNote } from "./revision-note";
import type { RevisionPage } from "./revision-page";
function note(id: string, number = 1): RevisionNote {
  return { id, number, type: "自定义类型", content: "说明", rect: null, layerId: null };
}
function page(): RevisionPage {
  return {
    width: 10,
    height: 20,
    layers: [],
    composite: { url: "page-image", bounds: { xCoord: 0, yCoord: 0, width: 1, height: 1 } },
    renderLayer: vi.fn(),
    dispose: vi.fn(),
  };
}
function deferredPage(): {
  promise: Promise<RevisionPage>;
  resolve: (value: RevisionPage) => void;
} {
  let resolve: (value: RevisionPage) => void = () => {
    throw new Error("Resolver not initialized");
  };
  const promise = new Promise<RevisionPage>((callback) => {
    resolve = callback;
  });
  return { promise, resolve };
}
describe("revision_note page loading", () => {
  it("loads only the requested page and preserves artifact numbering", async () => {
    const loadNotes = vi.fn(() => Promise.resolve([note("second", 42), note("first", 7)]));
    const loaded = page();
    const loadPage = vi.fn(() => Promise.resolve(loaded));
    const controller = createRevisionPageController(loadNotes, loadPage);
    await controller.load("page-2");
    expect(loadNotes.mock.calls).toEqual([["page-2"]]);
    expect(loadPage).toHaveBeenCalledWith("page-2", expect.any(AbortSignal));
    expect(controller.getSnapshot()).toMatchObject({
      pageId: "page-2",
      status: "ready",
      notes: [note("first", 7), note("second", 42)],
      page: loaded,
    });
    controller.dispose();
    expect(loaded.dispose).toHaveBeenCalled();
  });
  it("disposes stale page resources after rapid navigation", async () => {
    const deferred = deferredPage();
    const old = page();
    const current = page();
    const controller = createRevisionPageController(
      () => Promise.resolve([note("new")]),
      (id) => (id === "first" ? deferred.promise : Promise.resolve(current)),
    );
    const pending = controller.load("first");
    await controller.load("second");
    deferred.resolve(old);
    await pending;
    expect(old.dispose).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({ pageId: "second", page: current });
  });
  it("cancels loading but retains a ready page when changing read-only submode", async () => {
    const loaded = page();
    const controller = createRevisionPageController(
      () => Promise.resolve([]),
      () => Promise.resolve(loaded),
    );
    await controller.load("page");
    controller.cancel();
    expect(controller.getSnapshot().status).toBe("ready");
    expect(loaded.dispose).not.toHaveBeenCalled();
    await controller.load("other");
    expect(loaded.dispose).toHaveBeenCalled();
  });
  it("retries failure and releases a page even if notes fail first", async () => {
    const deferred = deferredPage();
    const late = page();
    const controller = createRevisionPageController(
      () => Promise.reject(new Error("offline")),
      () => deferred.promise,
    );
    await controller.load("page");
    expect(controller.getSnapshot()).toMatchObject({ status: "error", error: "offline" });
    deferred.resolve(late);
    await deferred.promise;
    await Promise.resolve();
    expect(late.dispose).toHaveBeenCalledOnce();
    const load = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
    const retry = createRevisionPageController(load, () => Promise.resolve(page()));
    await retry.load("page");
    await retry.load("page");
    expect(retry.getSnapshot()).toMatchObject({ status: "ready", notes: [] });
  });
});
