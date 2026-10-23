import type { ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { useAppStore } from "@/route/business/session/session-store";
import { deferred } from "@/test-resource/deferred";
import { loadCachedComicDetail } from "./comic-detail-cache";
import type { DetailComicInfo } from "./detail-request";
import { useComicDetailData } from "./use-comic-detail-data";
import { useDetailResource } from "./use-detail-resource";
import { detailClient, detailResponse } from "./test/detail-cache-fixture";
import { makeUser } from "./test/comic-detail-story-fixtures";

const scope = { userId: "user", generation: 1, teamId: "team" };

afterEach(() => {
  cleanup();
  useAppStore.setState({ selectedTeamId: null });
});

type MutationView = RenderHookResult<ReturnType<typeof useDetailResource>, unknown> & {
  onChanged: ReturnType<typeof vi.fn>;
  onClose: ReturnType<typeof vi.fn>;
};

function renderMutation(client: ApiClient, comic: DetailComicInfo): MutationView {
  const onChanged = vi.fn();
  const onClose = vi.fn();
  function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return (
      <ApiProvider client={client}>
        <ReadySessionProvider
          value={{ generation: 1, userInfo: makeUser("user", "User"), memberInfos: [] }}
        >
          {children}
        </ReadySessionProvider>
      </ApiProvider>
    );
  }
  return {
    ...renderHook(() => useDetailResource({ comic, onChanged, onClose }), { wrapper: Wrapper }),
    onChanged,
    onClose,
  };
}

async function pendingMutation(): Promise<
  ReturnType<typeof detailClient> &
    Pick<MutationView, "onChanged" | "onClose"> & {
      pending: ReturnType<typeof deferred<Response>>;
      saving: ReturnType<ReturnType<typeof useDetailResource>["onUpdateComic"]>;
    }
> {
  useAppStore.setState({ selectedTeamId: "team" });
  const { client, fetchImpl } = detailClient();
  const loaded = await loadCachedComicDetail(client, scope, "comic");
  if (!loaded.success) throw new Error(loaded.error);
  const pending = deferred<Response>();
  fetchImpl.mockImplementation((input, init) =>
    init?.method === "PUT" ? pending.promise : Promise.resolve(detailResponse(input, "updated")),
  );
  const resource = renderMutation(client, loaded.data.comicInfo);
  const saving = resource.result.current.onUpdateComic({ title: "updated", author: "author" });
  resource.unmount();
  return {
    client,
    fetchImpl,
    pending,
    saving,
    onChanged: resource.onChanged,
    onClose: resource.onClose,
  };
}

test("a completed write from a closed detail refreshes the reopened same-scope view", async () => {
  const { client, fetchImpl, pending, saving, onChanged, onClose } = await pendingMutation();
  const showToast = vi.fn();
  const { result } = renderHook(() => useComicDetailData(client, scope, "comic", showToast));
  await waitFor(() => {
    expect(result.current.detail?.comicInfo.title).toBe("comic");
  });
  expect(fetchImpl).toHaveBeenCalledTimes(3);
  await act(async () => {
    pending.resolve(Response.json({ code: 0 }));
    expect((await saving).success).toBe(true);
  });
  await waitFor(() => {
    expect(result.current.detail?.comicInfo.title).toBe("updated");
  });
  expect(fetchImpl).toHaveBeenCalledTimes(5);
  expect(onChanged).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(showToast).not.toHaveBeenCalled();
});

test("an old mutation invalidates its original scope while preserving a new identity cache", async () => {
  const { client, fetchImpl, pending, saving, onChanged } = await pendingMutation();
  const nextScope = { userId: "other", generation: 2, teamId: "other-team" };
  const showToast = vi.fn();
  const { result } = renderHook(() => useComicDetailData(client, nextScope, "comic", showToast));
  await waitFor(() => {
    expect(result.current.detail?.comicInfo.title).toBe("updated");
  });
  expect(fetchImpl).toHaveBeenCalledTimes(5);
  await act(async () => {
    pending.resolve(Response.json({ code: 0 }));
    await saving;
  });
  await loadCachedComicDetail(client, nextScope, "comic");
  expect(fetchImpl).toHaveBeenCalledTimes(5);
  await loadCachedComicDetail(client, scope, "comic");
  expect(fetchImpl).toHaveBeenCalledTimes(7);
  expect(result.current.detail?.comicInfo.title).toBe("updated");
  expect(onChanged).not.toHaveBeenCalled();
  expect(showToast).not.toHaveBeenCalled();
});
