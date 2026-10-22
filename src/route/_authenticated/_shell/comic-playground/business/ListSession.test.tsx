import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { Result } from "@/shared/utility/result";
import type { PageLoader } from "@/shared/hook/paged-list";
import { deferred } from "@/test-resource/deferred";
import { useAppStore } from "@/route/business/session/session-store";
import { useComicTranslationList } from "../../business/comic-list/use-comic-translation-list";
import { useComicProgressList } from "./progress/use-comic-progress-list";

afterEach(() => {
  useAppStore.getState().setAccessToken(null);
});

const listHooks = [
  ["translator", useComicTranslationList],
  ["reviewer", useComicProgressList],
] as const;

test.each(listHooks)(
  "%s resets only when query or authenticated generation changes",
  async (_, useList) => {
    const pending = deferred<Result<never[]>>();
    const loader = vi
      .fn<PageLoader<never>>()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ success: true, data: [] });
    const { rerender, unmount } = renderHook(() => useList(loader));
    rerender();
    expect(loader).toHaveBeenCalledOnce();
    const oldSignal = loader.mock.calls[0]?.[2];
    act(() => {
      useAppStore.getState().setAccessToken("replacement-token");
    });
    expect(oldSignal?.aborted).toBe(true);
    await waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(2);
    });
    rerender();
    expect(loader).toHaveBeenCalledTimes(2);
    await act(async () => {
      pending.resolve({ success: true, data: [] });
      await pending.promise;
    });
    unmount();
  },
);
