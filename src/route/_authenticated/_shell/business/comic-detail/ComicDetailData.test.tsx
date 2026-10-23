import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { deferred } from "@/test-resource/deferred";
import { useComicDetailData } from "./use-comic-detail-data";
import { detailClient, detailResponse } from "./test/detail-cache-fixture";

const scope = { userId: "user", generation: 1, teamId: "team" };

afterEach(cleanup);

test("mutation refresh keeps the current detail mounted until replacement arrives", async () => {
  const { client, fetchImpl } = detailClient();
  const showToast = vi.fn();
  const { result } = renderHook(() => useComicDetailData(client, scope, "comic", showToast));
  await waitFor(() => {
    expect(result.current.detail?.comicInfo.title).toBe("comic");
  });
  const original = result.current.detail;
  const next = deferred<Response>();
  fetchImpl.mockReturnValueOnce(next.promise);
  act(() => {
    result.current.refresh();
  });
  expect(result.current.detail).toBe(original);
  await act(async () => {
    next.resolve(detailResponse("/api/v1/comics/comic", "new title"));
    await next.promise;
  });
  await waitFor(() => {
    expect(result.current.detail?.comicInfo.title).toBe("new title");
  });
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});

test("closing and reopening while loading shares the in-flight operation", async () => {
  const { client, fetchImpl } = detailClient();
  const pending = deferred<Response>();
  fetchImpl.mockReturnValueOnce(pending.promise);
  const showToast = vi.fn();
  const { result, rerender } = renderHook<ReturnType<typeof useComicDetailData>, string | null>(
    (comicId) => useComicDetailData(client, scope, comicId, showToast),
    { initialProps: "comic" },
  );
  rerender(null);
  expect(result.current.detail).toBeNull();
  rerender("comic");
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  await act(async () => {
    pending.resolve(detailResponse("/api/v1/comics/comic"));
    await pending.promise;
  });
  await waitFor(() => {
    expect(result.current.detail?.comicInfo.id).toBe("comic");
  });
  rerender(null);
  rerender("comic");
  expect(result.current.detail?.comicInfo.id).toBe("comic");
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("replacement team or session does not display the previous scope's detail", async () => {
  const { client, fetchImpl } = detailClient();
  const showToast = vi.fn();
  const { result, rerender } = renderHook(
    (owner) => useComicDetailData(client, owner, "comic", showToast),
    { initialProps: scope },
  );
  await waitFor(() => {
    expect(result.current.detail).not.toBeNull();
  });
  const old = deferred<Response>();
  fetchImpl.mockReturnValueOnce(old.promise);
  rerender({ ...scope, teamId: "team-b" });
  expect(result.current.detail).toBeNull();
  rerender({ ...scope, teamId: "team-b", generation: 2 });
  await waitFor(() => {
    expect(result.current.detail?.comicInfo.title).toBe("comic");
  });
  await act(async () => {
    old.resolve(detailResponse("/api/v1/comics/comic", "old team"));
    await old.promise;
  });
  expect(result.current.detail?.comicInfo.title).toBe("comic");
  expect(fetchImpl).toHaveBeenCalledTimes(6);
});

test("failed background refresh retains the old detail and reports a retryable failure", async () => {
  const { client, fetchImpl } = detailClient();
  const showToast = vi.fn();
  const { result } = renderHook(() => useComicDetailData(client, scope, "comic", showToast));
  await waitFor(() => {
    expect(result.current.detail).not.toBeNull();
  });
  fetchImpl.mockResolvedValueOnce(
    Response.json({ code: 1, message: "unavailable" }, { status: 503 }),
  );
  act(() => {
    result.current.refresh();
  });
  await waitFor(() => {
    expect(result.current.error).toBe("unavailable");
  });
  expect(result.current.detail?.comicInfo.id).toBe("comic");
  expect(showToast).toHaveBeenCalledOnce();
  act(() => {
    result.current.refresh();
  });
  await waitFor(() => {
    expect(result.current.error).toBeNull();
  });
  expect(fetchImpl).toHaveBeenCalledTimes(6);
});

test("old refresh callbacks cannot invalidate a replacement session or a reopened view", async () => {
  const { client, fetchImpl } = detailClient();
  const showToast = vi.fn();
  const { result, rerender, unmount } = renderHook(
    (owner) => useComicDetailData(client, owner, "comic", showToast),
    { initialProps: scope },
  );
  await waitFor(() => {
    expect(result.current.detail).not.toBeNull();
  });
  const oldRefresh = result.current.refresh;
  rerender({ ...scope, generation: 2 });
  await waitFor(() => {
    expect(result.current.detail).not.toBeNull();
  });
  act(() => {
    oldRefresh();
  });
  expect(fetchImpl).toHaveBeenCalledTimes(4);
  const latestRefresh = result.current.refresh;
  unmount();
  latestRefresh();
  const reopened = renderHook(() =>
    useComicDetailData(client, { ...scope, generation: 2 }, "comic", showToast),
  );
  await waitFor(() => {
    expect(reopened.result.current.detail).not.toBeNull();
  });
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});
