import { StrictMode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createModuleResource } from "@/shared/utility/module-resource";
import { deferred } from "@/test-resource/deferred";
import { useModuleResource } from "./use-module-resource";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("disabled views do not import, and intent preloads are shared through StrictMode", async () => {
  const pending = deferred<string>();
  const loader = vi.fn(() => pending.promise);
  const resource = createModuleResource(loader);
  const { result, rerender } = renderHook(({ enabled }) => useModuleResource(resource, enabled), {
    initialProps: { enabled: false },
    wrapper: StrictMode,
  });
  expect(loader).not.toHaveBeenCalled();
  let preload!: Promise<string>;
  act(() => {
    preload = resource.load();
  });
  rerender({ enabled: true });
  await act(async () => {
    pending.resolve("detail");
    await preload;
  });
  expect(loader).toHaveBeenCalledOnce();
  expect(result.current).toEqual({ status: "ready", module: "detail" });
});

test("an import error does not create a render-retry loop and an explicit retry recovers", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const failure = new Error("offline");
  const loader = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(failure)
    .mockResolvedValueOnce("editor");
  const resource = createModuleResource(loader);
  const { result, rerender } = renderHook(() => useModuleResource(resource));
  await waitFor(() => {
    expect(result.current).toEqual({ status: "error", error: failure });
  });
  rerender();
  expect(loader).toHaveBeenCalledOnce();
  await act(async () => {
    await resource.load();
  });
  expect(result.current).toEqual({ status: "ready", module: "editor" });
  expect(loader).toHaveBeenCalledTimes(2);
});

test("switching resource owners never displays a late module from the previous owner", async () => {
  const old = deferred<string>();
  const previous = createModuleResource(() => old.promise);
  const current = createModuleResource(() => Promise.resolve("current"));
  const { result, rerender } = renderHook(({ resource }) => useModuleResource(resource), {
    initialProps: { resource: previous },
  });
  rerender({ resource: current });
  await waitFor(() => {
    expect(result.current).toEqual({ status: "ready", module: "current" });
  });
  await act(async () => {
    old.resolve("previous");
    await previous.load();
  });
  expect(result.current).toEqual({ status: "ready", module: "current" });
});
