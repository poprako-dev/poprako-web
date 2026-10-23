import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useAppStore } from "@/route/business/session/session-store";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import * as worksetApi from "@/api/workset/workset-api";
import * as requests from "./workset/workset-request";
import { deferred, fixture, workset } from "./WorksetTestFixture";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAppStore.getState().setAccessToken(null);
});

test("returning to the mutation's team refreshes the current owner without losing selection", async () => {
  const created = deferred<Result<string>>();
  const load = vi.spyOn(requests, "listWorksets").mockImplementation((_client, args) =>
    Promise.resolve({
      success: true,
      data: [workset("one", args.teamId), workset("two", args.teamId)],
    }),
  );
  vi.spyOn(worksetApi, "createWorkset").mockReturnValue(created.promise);
  const { mount } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("one");
  });
  act(() => {
    view.result.current.setActiveWorksetId("two");
  });
  const pending = view.result.current.handleCreateWorkset({ teamId: "first", name: "new" });
  act(() => {
    useAppStore.setState({ selectedTeamId: "second" });
    view.rerender({ teamId: "second" });
  });
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("one");
  });
  act(() => {
    useAppStore.setState({ selectedTeamId: "first" });
    view.rerender({ teamId: "first" });
  });
  expect(view.result.current.activeWorksetId).toBe("two");
  await act(async () => {
    created.resolve({ success: true, data: "new" });
    expect(await pending).toEqual({ success: false, error: "会话已失效" });
  });
  expect(load).toHaveBeenCalledTimes(3);
  expect(view.result.current.activeWorksetId).toBe("two");
});

test("a superseded refresh cannot overwrite the latest response or its cache", async () => {
  const older = deferred<Result<WorksetInfo[]>>();
  const newer = deferred<Result<WorksetInfo[]>>();
  const load = vi
    .spyOn(requests, "listWorksets")
    .mockResolvedValueOnce({ success: true, data: [workset("initial")] })
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(newer.promise);
  const { mount } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("initial");
  });
  const first = view.result.current.loadWorksets();
  const second = view.result.current.loadWorksets();
  expect(load.mock.calls[1]?.[1].signal?.aborted).toBe(true);
  await act(async () => {
    newer.resolve({ success: true, data: [workset("newer")] });
    await second;
    older.resolve({ success: true, data: [workset("older")] });
    await first;
  });
  expect(view.result.current.activeWorksetId).toBe("newer");
  view.unmount();
  const restored = mount();
  expect(restored.result.current.activeWorksetId).toBe("newer");
  expect(load).toHaveBeenCalledTimes(3);
});

test("TTL expiry revalidates cached data without clearing the selection", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(0);
  const refresh = deferred<Result<WorksetInfo[]>>();
  const load = vi
    .spyOn(requests, "listWorksets")
    .mockResolvedValueOnce({ success: true, data: [workset("one"), workset("two")] })
    .mockReturnValueOnce(refresh.promise);
  const { mount } = fixture();
  const first = mount();
  await waitFor(() => {
    expect(first.result.current.activeWorksetId).toBe("one");
  });
  clock.mockReturnValue(29_999);
  act(() => {
    first.result.current.setActiveWorksetId("two");
  });
  first.unmount();
  const fresh = mount();
  expect(load).toHaveBeenCalledTimes(1);
  fresh.unmount();
  clock.mockReturnValue(30_000);
  const expired = mount();
  expect(expired.result.current.activeWorksetId).toBe("two");
  expect(expired.result.current.worksets).toHaveLength(2);
  expect(load).toHaveBeenCalledTimes(2);
  await act(async () => {
    refresh.resolve({ success: true, data: [workset("one"), workset("two"), workset("three")] });
    await refresh.promise;
  });
  expect(expired.result.current.activeWorksetId).toBe("two");
  expect(expired.result.current.worksets).toHaveLength(3);
});

test("StrictMode keeps functional selection updates and the restored cache consistent", async () => {
  const load = vi.spyOn(requests, "listWorksets").mockResolvedValue({
    success: true,
    data: [workset("one"), workset("two"), workset("three")],
  });
  const { mount } = fixture();
  const view = mount("first", true);
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("one");
  });
  act(() => {
    view.result.current.setActiveWorksetId((previous) => (previous === "one" ? "two" : "one"));
    view.result.current.setActiveWorksetId((previous) => (previous === "two" ? "three" : "one"));
  });
  expect(view.result.current.activeWorksetId).toBe("three");
  const calls = load.mock.calls.length;
  view.unmount();
  const restored = mount("first", true);
  expect(restored.result.current.activeWorksetId).toBe("three");
  expect(load).toHaveBeenCalledTimes(calls);
});
