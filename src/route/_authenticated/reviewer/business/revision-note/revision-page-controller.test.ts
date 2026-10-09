import { describe, expect, it, vi } from "vitest";
import { createRevisionPageController } from "./revision-page-controller";
import type { RevisionNote } from "./revision-note";
import type { RevisionPage } from "./revision-page";
function note(id: string, number = 1): RevisionNote {
  return { id, number, type: "断行", content: "说明", rect: null, layerId: null };
}
function page(): RevisionPage {
  return {
    width: 10,
    height: 20,
    layers: [],
    composite: { source: "image", bounds: { xCoord: 0, yCoord: 0, width: 1, height: 1 } },
    dispose: vi.fn(),
  };
}
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((callback) => {
    resolve = callback;
  });
  return { promise, resolve };
}
describe("Reviewer resource ownership", () => {
  it("loads only the current page with cancellation and original note numbering", async () => {
    const notes = vi.fn(() => Promise.resolve([note("second", 42), note("first", 7)]));
    const loaded = page();
    const pages = vi.fn(() => Promise.resolve(loaded));
    const controller = createRevisionPageController(notes, pages);
    await controller.load("page-2");
    expect(notes).toHaveBeenCalledWith("page-2", expect.any(AbortSignal));
    expect(pages).toHaveBeenCalledWith("page-2", expect.any(AbortSignal));
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      notesStatus: "ready",
      notes: [note("first", 7), note("second", 42)],
      page: loaded,
    });
    controller.dispose();
    expect(loaded.dispose).toHaveBeenCalledOnce();
  });
  it("disposes stale PSDs and ignores late notes after navigation", async () => {
    const first = deferred<RevisionPage>();
    const oldNotes = deferred<RevisionNote[]>();
    const old = page();
    const current = page();
    const controller = createRevisionPageController(
      (id) => (id === "first" ? oldNotes.promise : Promise.resolve([note("new")])),
      (id) => (id === "first" ? first.promise : Promise.resolve(current)),
    );
    const pending = controller.load("first");
    await controller.load("second");
    first.resolve(old);
    oldNotes.resolve([note("old")]);
    await pending;
    expect(old.dispose).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({
      pageId: "second",
      page: current,
      notes: [note("new")],
    });
  });
  it("renders PSD while notes remain pending and retries notes without decoding again", async () => {
    const pending = deferred<RevisionNote[]>();
    const pages = vi.fn(() => Promise.resolve(page()));
    const notes = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue([]);
    const controller = createRevisionPageController(notes, pages);
    const load = controller.load("page");
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.getSnapshot()).toMatchObject({ status: "ready", notesStatus: "loading" });
    await controller.retryNotes();
    pending.resolve([note("stale")]);
    await load;
    expect(pages).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().notes).toEqual([]);
  });
  it("keeps PSD on note failure and succeeds after scoped retry", async () => {
    const loaded = page();
    const notes = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([note("fixed")]);
    const pages = vi.fn(() => Promise.resolve(loaded));
    const controller = createRevisionPageController(notes, pages);
    await controller.load("page");
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      page: loaded,
      notesStatus: "error",
      notesError: "offline",
    });
    expect(loaded.dispose).not.toHaveBeenCalled();
    await controller.retryNotes();
    expect(pages).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({ notesError: null, notes: [note("fixed")] });
  });
  it("supports absent notes and preserves notes across a PSD retry", async () => {
    const pages = vi.fn().mockRejectedValueOnce(new Error("bad PSD")).mockResolvedValue(page());
    const notes = vi.fn(() => Promise.resolve([note("keep")]));
    const controller = createRevisionPageController(notes, pages);
    await controller.load("page");
    await controller.retryPage();
    expect(notes).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({ status: "ready", notes: [note("keep")] });
    const empty = createRevisionPageController(null, () => Promise.resolve(page()));
    await empty.load("page");
    expect(empty.getSnapshot()).toMatchObject({ status: "ready", notesStatus: "ready", notes: [] });
  });
  it("aborts requests on exit and never adopts late page resources", async () => {
    const late = deferred<RevisionPage>();
    const loaded = page();
    let signal: AbortSignal | undefined;
    const controller = createRevisionPageController(null, (_id, request) => {
      signal = request;
      return late.promise;
    });
    const pending = controller.load("page");
    controller.dispose();
    expect(signal?.aborted).toBe(true);
    late.resolve(loaded);
    await pending;
    expect(loaded.dispose).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().status).toBe("idle");
  });
});

it("shows loading before awaiting old-page release and skips superseded navigation", async () => {
  const release = deferred<undefined>();
  const first = page();
  first.dispose = vi.fn(() => release.promise);
  const pages = vi.fn().mockResolvedValueOnce(first).mockResolvedValue(page());
  const controller = createRevisionPageController(null, pages);
  await controller.load("first");
  const second = controller.load("second");
  expect(controller.getSnapshot()).toMatchObject({
    page: null,
    status: "loading",
    pageId: "second",
  });
  expect(first.dispose).toHaveBeenCalledOnce();
  expect(pages).toHaveBeenCalledTimes(1);
  const third = controller.load("third");
  await Promise.resolve();
  expect(pages).toHaveBeenCalledTimes(1);
  release.resolve(undefined);
  await Promise.all([second, third]);
  expect(pages).toHaveBeenCalledTimes(2);
  expect(pages).toHaveBeenLastCalledWith("third", expect.any(AbortSignal));
  expect(controller.getSnapshot()).toMatchObject({ status: "ready", pageId: "third" });
});

it("does not allocate the queued page when exiting during previous-page release", async () => {
  const release = deferred<undefined>();
  const first = page();
  first.dispose = () => release.promise;
  const pages = vi.fn(() => Promise.resolve(first));
  const controller = createRevisionPageController(null, pages);
  await controller.load("first");
  const pending = controller.load("second");
  controller.dispose();
  release.resolve(undefined);
  await pending;
  expect(pages).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().status).toBe("idle");
});
