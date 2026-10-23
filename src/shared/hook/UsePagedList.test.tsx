import { deferred } from "@/test-resource/deferred";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { Result } from "@/shared/utility/result";
import type { PageLoader } from "./paged-list";
import { usePagedList } from "./use-paged-list";

test("changing a query aborts old data and ignores its later response", async () => {
  const old = deferred<Result<string[]>>();
  const first = vi.fn<PageLoader<string>>(() => old.promise);
  const next = vi.fn<PageLoader<string>>().mockResolvedValue({ success: true, data: ["new"] });
  const { result, rerender, unmount } = renderHook(
    ({ loader }) => usePagedList({ loader, pageSize: 2 }),
    { initialProps: { loader: first } },
  );
  const signal = first.mock.calls[0]?.[2];
  rerender({ loader: next });
  expect(signal?.aborted).toBe(true);
  await waitFor(() => {
    expect(result.current.items).toEqual(["new"]);
  });
  await act(async () => {
    old.resolve({ success: true, data: ["old"] });
    await old.promise;
  });
  expect(result.current.items).toEqual(["new"]);
  unmount();
});

test("identity and invalidation keys reset even when the loader identity is stable", async () => {
  const old = deferred<Result<string[]>>();
  const loader = vi
    .fn<PageLoader<string>>()
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ success: true, data: ["next session"] });
  const { result, rerender, unmount } = renderHook(
    ({ resetKey }) => usePagedList({ loader, pageSize: 2, resetKey }),
    { initialProps: { resetKey: "session:1" } },
  );
  const signal = loader.mock.calls[0]?.[2];
  rerender({ resetKey: "session:2" });
  expect(signal?.aborted).toBe(true);
  await waitFor(() => {
    expect(result.current.items).toEqual(["next session"]);
  });
  expect(loader.mock.calls.map(([offset]) => offset)).toEqual([0, 0]);
  await act(async () => {
    old.resolve({ success: true, data: ["old session"] });
    await old.promise;
  });
  expect(result.current.items).toEqual(["next session"]);
  unmount();
});
