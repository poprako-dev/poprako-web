import { describe, expect, it, vi } from "vitest";
import { createReviewPageController } from "./review-page-controller";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { ReviewPage } from "./review-page";
function issue(id: string, index = 0): IssueInfo {
  return {
    id,
    pageArtworkId: "page",
    index,
    variant: "断行",
    note: "说明",
    rect: null,
    layerName: null,
  };
}
function page(): ReviewPage {
  return {
    width: 10,
    height: 20,
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
  it("loads only the current page with cancellation and page issue ordering", async () => {
    const issues = vi.fn(() => Promise.resolve([issue("second", 42), issue("first", 7)]));
    const loaded = page();
    const pages = vi.fn(() => Promise.resolve(loaded));
    const controller = createReviewPageController(issues, pages);
    await controller.load("page-2");
    expect(issues).toHaveBeenCalledWith("page-2", expect.any(AbortSignal));
    expect(pages).toHaveBeenCalledWith("page-2", expect.any(AbortSignal), expect.any(Function));
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      issuesStatus: "ready",
      issues: [issue("first", 7), issue("second", 42)],
      page: loaded,
    });
    controller.dispose();
    expect(loaded.dispose).toHaveBeenCalledOnce();
  });
});
describe("Reviewer resource ownership", () => {
  it("disposes stale PSDs and ignores late issues after navigation", async () => {
    const first = deferred<ReviewPage>();
    const oldIssues = deferred<IssueInfo[]>();
    const old = page();
    const current = page();
    const controller = createReviewPageController(
      (id) => (id === "first" ? oldIssues.promise : Promise.resolve([issue("new")])),
      (id) => (id === "first" ? first.promise : Promise.resolve(current)),
    );
    const pending = controller.load("first");
    await controller.load("second");
    first.resolve(old);
    oldIssues.resolve([issue("old")]);
    await pending;
    expect(old.dispose).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({
      pageId: "second",
      page: current,
      issues: [issue("new")],
    });
  });
});
describe("Reviewer resource ownership", () => {
  it("renders PSD while issues remain pending and retries issues without decoding again", async () => {
    const pending = deferred<IssueInfo[]>();
    const pages = vi.fn(() => Promise.resolve(page()));
    const issues = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue([]);
    const controller = createReviewPageController(issues, pages);
    const load = controller.load("page");
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.getSnapshot()).toMatchObject({ status: "ready", issuesStatus: "loading" });
    await controller.retryIssues();
    pending.resolve([issue("stale")]);
    await load;
    expect(pages).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().issues).toEqual([]);
  });
});
describe("Reviewer resource ownership", () => {
  it("keeps PSD on note failure and succeeds after scoped retry", async () => {
    const loaded = page();
    const issues = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([issue("fixed")]);
    const pages = vi.fn(() => Promise.resolve(loaded));
    const controller = createReviewPageController(issues, pages);
    await controller.load("page");
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      page: loaded,
      issuesStatus: "error",
      issuesError: "offline",
    });
    expect(loaded.dispose).not.toHaveBeenCalled();
    await controller.retryIssues();
    expect(pages).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({ issuesError: null, issues: [issue("fixed")] });
  });
});
describe("Reviewer resource ownership", () => {
  it("supports absent issues and preserves issues across a PSD retry", async () => {
    const pages = vi.fn().mockRejectedValueOnce(new Error("bad PSD")).mockResolvedValue(page());
    const issues = vi.fn(() => Promise.resolve([issue("keep")]));
    const controller = createReviewPageController(issues, pages);
    await controller.load("page");
    await controller.retryPage();
    expect(issues).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toMatchObject({ status: "ready", issues: [issue("keep")] });
    const empty = createReviewPageController(
      () => Promise.resolve([]),
      () => Promise.resolve(page()),
    );
    await empty.load("page");
    expect(empty.getSnapshot()).toMatchObject({
      status: "ready",
      issuesStatus: "ready",
      issues: [],
    });
  });
});
describe("Reviewer resource ownership", () => {
  it("aborts requests on exit and never adopts late page resources", async () => {
    const late = deferred<ReviewPage>();
    const loaded = page();
    let signal: AbortSignal | undefined;
    const controller = createReviewPageController(
      () => Promise.resolve([]),
      (_id, request) => {
        signal = request;
        return late.promise;
      },
    );
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
  const controller = createReviewPageController(() => Promise.resolve([]), pages);
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
  expect(pages).toHaveBeenLastCalledWith("third", expect.any(AbortSignal), expect.any(Function));
  expect(controller.getSnapshot()).toMatchObject({ status: "ready", pageId: "third" });
});

it("does not allocate the queued page when exiting during previous-page release", async () => {
  const release = deferred<undefined>();
  const first = page();
  first.dispose = () => release.promise;
  const pages = vi.fn(() => Promise.resolve(first));
  const controller = createReviewPageController(() => Promise.resolve([]), pages);
  await controller.load("first");
  const pending = controller.load("second");
  controller.dispose();
  release.resolve(undefined);
  await pending;
  expect(pages).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().status).toBe("idle");
});
