import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as comicApi from "@/api/comic/comic-api";
import * as worksetApi from "@/api/workset/workset-api";
import { useAppStore } from "@/route/business/session/session-store";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import * as requests from "./workset/workset-request";
import { useComicPlaygroundActions } from "./use-comic-playground-actions";
import { deferred, fixture, workset } from "./WorksetTestFixture";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAppStore.getState().setAccessToken(null);
});

test("updating a workset starts one background refresh without delaying mutation completion", async () => {
  const refresh = deferred<Result<WorksetInfo[]>>();
  const load = vi.spyOn(requests, "listWorksets");
  load.mockResolvedValueOnce({ success: true, data: [workset("one")] });
  load.mockReturnValue(refresh.promise);
  vi.spyOn(worksetApi, "updateWorkset").mockResolvedValue({ success: true, data: undefined });
  const { client, mount } = fixture();
  const worksets = mount();
  await waitFor(() => {
    expect(worksets.result.current.activeWorksetId).toBe("one");
  });
  const loadWorksets = vi.fn(worksets.result.current.loadWorksets);
  const actions = renderHook(() =>
    useComicPlaygroundActions({
      client,
      activeWorksetId: "one",
      activeTitle: "",
      activeStages: undefined,
      loadWorksets,
      retryComicDetail: vi.fn(),
      setRefreshKey: vi.fn(),
    }),
  );
  await act(async () => {
    expect(await actions.result.current.handleUpdateWorkset("one", { name: "changed" })).toEqual({
      success: true,
      data: undefined,
    });
  });
  expect(loadWorksets).not.toHaveBeenCalled();
  expect(load).toHaveBeenCalledTimes(2);
  expect(load.mock.calls[1]?.[1].signal?.aborted).toBe(false);
  await act(async () => {
    refresh.resolve({ success: true, data: [{ ...workset("one"), name: "changed" }] });
    await refresh.promise;
  });
  expect(worksets.result.current.worksets[0]?.name).toBe("changed");
});

test("creating a comic retains its single explicit workset refresh", async () => {
  const load = vi.spyOn(requests, "listWorksets");
  load.mockResolvedValue({ success: true, data: [workset("one")] });
  vi.spyOn(comicApi, "createComic").mockResolvedValue({ success: true, data: { id: "comic" } });
  const { client, mount } = fixture();
  const worksets = mount();
  await waitFor(() => {
    expect(worksets.result.current.activeWorksetId).toBe("one");
  });
  const loadWorksets = vi.fn(worksets.result.current.loadWorksets);
  const setRefreshKey = vi.fn();
  const actions = renderHook(() =>
    useComicPlaygroundActions({
      client,
      activeWorksetId: "one",
      activeTitle: "",
      activeStages: undefined,
      loadWorksets,
      retryComicDetail: vi.fn(),
      setRefreshKey,
    }),
  );
  await act(async () => {
    expect(
      await actions.result.current.handleCreateComic({
        worksetId: "one",
        title: "new",
        author: "",
      }),
    ).toEqual({ success: true, data: "comic" });
  });
  expect(loadWorksets).toHaveBeenCalledTimes(1);
  expect(load).toHaveBeenCalledTimes(2);
  expect(setRefreshKey).toHaveBeenCalledTimes(1);
});
