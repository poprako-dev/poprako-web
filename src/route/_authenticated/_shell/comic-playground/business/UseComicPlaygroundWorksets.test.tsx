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

test("returning to a team reuses fresh worksets and the selected workset", async () => {
  const load = vi.spyOn(requests, "listWorksets").mockResolvedValue({
    success: true,
    data: [workset("one"), workset("two")],
  });
  const { mount } = fixture();
  const first = mount();
  await waitFor(() => {
    expect(first.result.current.worksets).toHaveLength(2);
  });
  act(() => {
    first.result.current.setActiveWorksetId("two");
  });
  first.unmount();
  const second = mount();
  expect(second.result.current.activeWorksetId).toBe("two");
  expect(second.result.current.worksets).toHaveLength(2);
  expect(load).toHaveBeenCalledTimes(1);
});

test("switching teams aborts old reads and ignores their late responses", async () => {
  const first = deferred<Result<WorksetInfo[]>>();
  const second = deferred<Result<WorksetInfo[]>>();
  const load = vi
    .spyOn(requests, "listWorksets")
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { mount, showToast } = fixture();
  const view = mount();
  const firstSignal = load.mock.calls[0]?.[1].signal;
  act(() => {
    useAppStore.setState({ selectedTeamId: "second" });
    view.rerender({ teamId: "second" });
  });
  expect(firstSignal?.aborted).toBe(true);
  expect(view.result.current.worksets).toEqual([]);
  await act(async () => {
    second.resolve({ success: true, data: [workset("new", "second")] });
    await second.promise;
  });
  await act(async () => {
    first.resolve({ success: true, data: [workset("old")] });
    await first.promise;
  });
  expect(view.result.current.worksets.map((value) => value.id)).toEqual(["new"]);
  expect(view.result.current.activeWorksetId).toBe("new");
  expect(showToast).not.toHaveBeenCalled();
});

test("new credentials cannot reuse the previous generation's worksets", async () => {
  const load = vi.spyOn(requests, "listWorksets").mockResolvedValue({
    success: true,
    data: [workset("previous")],
  });
  const { mount } = fixture();
  const first = mount();
  await waitFor(() => {
    expect(first.result.current.activeWorksetId).toBe("previous");
  });
  first.unmount();
  useAppStore.getState().setAccessToken("replacement");
  load.mockResolvedValue({ success: true, data: [workset("replacement")] });
  const second = mount();
  expect(second.result.current.worksets).toEqual([]);
  await waitFor(() => {
    expect(second.result.current.activeWorksetId).toBe("replacement");
  });
  expect(load).toHaveBeenCalledTimes(2);
});

test("an explicit refresh retains current worksets until replacement arrives", async () => {
  const refresh = deferred<Result<WorksetInfo[]>>();
  const load = vi
    .spyOn(requests, "listWorksets")
    .mockResolvedValueOnce({
      success: true,
      data: [workset("old")],
    })
    .mockReturnValueOnce(refresh.promise);
  const { mount } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("old");
  });
  let pending: Promise<void>;
  act(() => {
    pending = view.result.current.loadWorksets();
  });
  expect(view.result.current.worksets.map((value) => value.id)).toEqual(["old"]);
  await act(async () => {
    refresh.resolve({ success: true, data: [workset("new")] });
    await pending;
  });
  expect(view.result.current.activeWorksetId).toBe("new");
  expect(load).toHaveBeenCalledTimes(2);
});

test("a completed create does not await the background list refresh", async () => {
  const refresh = deferred<Result<WorksetInfo[]>>();
  vi.spyOn(requests, "listWorksets")
    .mockResolvedValueOnce({
      success: true,
      data: [workset("existing")],
    })
    .mockReturnValueOnce(refresh.promise);
  vi.spyOn(worksetApi, "createWorkset").mockResolvedValue({ success: true, data: "created" });
  const { mount } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("existing");
  });
  await act(async () => {
    expect(await view.result.current.handleCreateWorkset({ teamId: "first", name: "new" })).toEqual(
      { success: true, data: "created" },
    );
  });
  expect(view.result.current.activeWorksetId).toBe("existing");
  await act(async () => {
    refresh.resolve({ success: true, data: [workset("created")] });
    await refresh.promise;
  });
  expect(view.result.current.activeWorksetId).toBe("created");
});

test("a create finishing after a team switch cannot restart the old team's reads", async () => {
  const created = deferred<Result<string>>();
  const load = vi
    .spyOn(requests, "listWorksets")
    .mockImplementation((_client, args) =>
      Promise.resolve({ success: true, data: [workset(args.teamId, args.teamId)] }),
    );
  vi.spyOn(worksetApi, "createWorkset").mockReturnValue(created.promise);
  const { mount } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("first");
  });
  const pending = view.result.current.handleCreateWorkset({ teamId: "first", name: "new" });
  act(() => {
    useAppStore.setState({ selectedTeamId: "second" });
    view.rerender({ teamId: "second" });
  });
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("second");
  });
  await act(async () => {
    created.resolve({ success: true, data: "old-team-new-workset" });
    await pending;
  });
  expect(load).toHaveBeenCalledTimes(2);
  expect(view.result.current.activeWorksetId).toBe("second");
});

test("a mutation finishing after unmount cannot restart reads or display errors", async () => {
  const created = deferred<Result<string>>();
  const removed = deferred<Result<undefined>>();
  const load = vi.spyOn(requests, "listWorksets").mockResolvedValue({
    success: true,
    data: [workset("first")],
  });
  vi.spyOn(worksetApi, "createWorkset").mockReturnValue(created.promise);
  vi.spyOn(worksetApi, "deleteWorkset").mockReturnValue(removed.promise);
  const { mount, showToast } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("first");
  });
  const creation = view.result.current.handleCreateWorkset({ teamId: "first", name: "new" });
  const removal = view.result.current.handleDeleteWorkset("first");
  view.unmount();
  created.resolve({ success: true, data: "new" });
  removed.resolve({ success: false, error: "late failure" });
  await Promise.all([creation, removal]);
  expect(load).toHaveBeenCalledTimes(1);
  expect(showToast).not.toHaveBeenCalled();
});

test("deleting the selected workset refreshes the list and selects a remaining workset", async () => {
  vi.spyOn(requests, "listWorksets")
    .mockResolvedValueOnce({ success: true, data: [workset("one"), workset("two")] })
    .mockResolvedValueOnce({ success: true, data: [workset("two")] })
    .mockResolvedValueOnce({ success: true, data: [] });
  const remove = vi.spyOn(worksetApi, "deleteWorkset").mockResolvedValue({
    success: true,
    data: undefined,
  });
  const { mount, client, showToast } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("one");
  });
  await act(async () => {
    expect(await view.result.current.handleDeleteWorkset("one")).toEqual({
      success: true,
      data: undefined,
    });
  });
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("two");
  });
  expect(remove).toHaveBeenCalledWith(client, "one");
  expect(view.result.current.worksets.map((item) => item.id)).toEqual(["two"]);
  expect(showToast).toHaveBeenCalledWith("作品集已删除", "success");
  await act(async () => {
    await view.result.current.handleDeleteWorkset("two");
  });
  await waitFor(() => {
    expect(view.result.current.worksets).toEqual([]);
  });
  expect(view.result.current.activeWorksetId).toBe("");
});

test("a failed deletion returns its error and keeps the workset selected", async () => {
  const failure = { success: false as const, error: "没有删除权限" };
  const load = vi.spyOn(requests, "listWorksets").mockResolvedValue({
    success: true,
    data: [workset("one")],
  });
  vi.spyOn(worksetApi, "deleteWorkset").mockResolvedValue(failure);
  const { mount, showToast } = fixture();
  const view = mount();
  await waitFor(() => {
    expect(view.result.current.activeWorksetId).toBe("one");
  });
  await act(async () => {
    expect(await view.result.current.handleDeleteWorkset("one")).toEqual(failure);
  });
  expect(view.result.current.activeWorksetId).toBe("one");
  expect(view.result.current.worksets).toHaveLength(1);
  expect(load).toHaveBeenCalledOnce();
  expect(showToast).toHaveBeenCalledWith("没有删除权限", "error");
});
