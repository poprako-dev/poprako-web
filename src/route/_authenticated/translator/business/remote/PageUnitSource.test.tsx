import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { useAppStore } from "@/route/business/session/session-store";
import { usePageUnitActions, usePageUnitSource } from "./use-page-unit-source";
import { createDraftStore } from "../persistence/draft-store";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createStoryArgs } from "../test/base-translator-story-fixture";
import { useEditorSession } from "../editor/use-editor-session";
import { undoUnit } from "../test/unit-undo-fixture";
import type { UnitInfo } from "../unit/unit";

function backend(): {
  client: ReturnType<typeof createApiClient>;
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const data = url.includes("/save")
      ? { created_unit_ids: [] }
      : {
          total_unit_count: 1,
          translated_unit_count: 1,
          proofread_unit_count: 1,
          unit_infos: [
            {
              id: "u1",
              page_id: "page-1",
              x_coord: 0,
              y_coord: 0,
              is_bubble: true,
              is_flagged: false,
              is_proofread: true,
              translated_text: "translation",
              proofread_text: "proofread",
              translation_note: "note",
              typography_note: "layout",
              created_at: 0,
              updated_at: 0,
            },
          ],
        };
    return Promise.resolve(Response.json({ code: 0, data }));
  });
  return {
    client: createApiClient({
      baseUrl: "/api/v1",
      getAccessToken: () => null,
      fetchImpl: fetchMock,
    }),
    fetchMock,
  };
}

test.each(["client", "chapterId", "userId"] as const)(
  "unit source is isolated by %s",
  async (key) => {
    const first = backend();
    const second = backend();
    const initialProps = { client: first.client, chapterId: "c1", userId: "u1" };
    const hook = renderHook(
      (props) => usePageUnitSource(props.client, props.chapterId, props.userId),
      {
        initialProps,
      },
    );
    const previous = hook.result.current;
    previous.prefetch(["page-2"]);
    await waitFor(() => {
      expect(first.fetchMock).toHaveBeenCalledTimes(1);
    });
    const changed = { ...initialProps, [key]: key === "client" ? second.client : "different" };
    hook.rerender(changed);
    expect(hook.result.current).not.toBe(previous);
    await hook.result.current.read("page-2");
    expect(first.fetchMock).toHaveBeenCalledTimes(key === "client" ? 1 : 2);
    expect(second.fetchMock).toHaveBeenCalledTimes(key === "client" ? 1 : 0);
    hook.unmount();
  },
);

test("a session generation change discards the old source", async () => {
  const { client, fetchMock } = backend();
  const initialGeneration = useAppStore.getState().generation;
  const hook = renderHook(() => usePageUnitSource(client, "c1", "u1"));
  const previous = hook.result.current;
  previous.prefetch(["page-2"]);
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  await act(() => useAppStore.setState({ generation: initialGeneration + 1 }));
  expect(hook.result.current).not.toBe(previous);
  await hook.result.current.read("page-2");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  hook.unmount();
  await act(() => useAppStore.setState({ generation: initialGeneration }));
});

async function actionsFixture(): Promise<{
  hook: ReturnType<typeof renderHook<ReturnType<typeof usePageUnitActions>, unknown>>;
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
  drafts: ReturnType<typeof createDraftStore>;
}> {
  const { client, fetchMock } = backend();
  const props = createStoryArgs({ canTranslate: true, canProofread: true });
  const drafts = createDraftStore("user", "chapter", createDraftDatabaseFixture());
  await drafts.ready;
  const hook = renderHook(() =>
    usePageUnitActions({
      client,
      chapterId: props.project.id,
      currentUser: { id: "user" },
      drafts,
      state: {
        status: "ready",
        project: props.project,
        comicId: "comic",
        canTranslate: true,
        canProofread: true,
      },
      setState: vi.fn(),
      activeRef: { current: true },
      latestLoadsRef: { current: new Map() },
    }),
  );
  return { hook, fetchMock, drafts };
}

test("neighbor prefetch retains all translation, proofread and annotation data", async () => {
  const { hook, fetchMock } = await actionsFixture();
  hook.result.current.handlePrefetchUnits("page-1");
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  const units = await hook.result.current.handleLoadUnits("page-2");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(units[0]).toMatchObject({
    translatedText: "translation",
    proofreadText: "proofread",
    translationNote: "note",
    typographyNote: "layout",
    isProofread: true,
  });
  await hook.result.current.handleReloadUnits("page-2");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  hook.unmount();
});

test("save and chapter transforms invalidate prefetched unit responses", async () => {
  const { hook, fetchMock } = await actionsFixture();
  hook.result.current.handlePrefetchUnits("page-1");
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  await hook.result.current.handleSaveUnits("page-2", { ops: [] }, "save-id");
  await hook.result.current.handleReloadUnits("page-2");
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock.mock.calls[1]?.[0]).toContain("save_id=save-id");
  hook.result.current.handlePrefetchUnits("page-1");
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  await hook.result.current.handleTransformUnits({
    part: "translatedText",
    unitIds: ["u1"],
    origin: "before",
    target: "after",
  });
  await hook.result.current.handleLoadUnits("page-2");
  expect(fetchMock).toHaveBeenCalledTimes(6);
  hook.unmount();
});

test("neighbors with unsaved drafts are excluded from background requests", async () => {
  const { hook, fetchMock, drafts } = await actionsFixture();
  drafts.update("page-2", {
    version: 1,
    revision: 1,
    baseline: [undoUnit()],
    units: [undoUnit("u1", "draft")],
    pending: [],
    identities: [],
  });
  hook.result.current.handlePrefetchUnits("page-1");
  await Promise.resolve();
  expect(fetchMock).not.toHaveBeenCalled();
  hook.unmount();
});

test("editor restores draft before requesting units and keeps full data across modes", async () => {
  const props = createStoryArgs({ canTranslate: true, canProofread: true });
  const drafts = createDraftStore("user", "chapter", createDraftDatabaseFixture());
  await drafts.ready;
  drafts.update("page-1", {
    version: 1,
    revision: 1,
    baseline: [undoUnit()],
    units: [{ ...undoUnit("u1", "draft"), proofreadText: "proofread", translationNote: "note" }],
    pending: [],
    identities: [],
  });
  props.drafts = drafts;
  props.onLoadUnits = vi.fn(props.onLoadUnits);
  props.onPrefetchUnits = vi.fn();
  const hook = renderHook(() => useEditorSession(props));
  await waitFor(() => {
    expect(hook.result.current.isLoadingPage).toBe(false);
  });
  expect(props.onLoadUnits).not.toHaveBeenCalled();
  expect(props.onPrefetchUnits).toHaveBeenCalledWith("page-1");
  act(() => {
    hook.result.current.handleSwitchView();
  });
  expect(props.onLoadUnits).not.toHaveBeenCalled();
  expect(hook.result.current.unitBuf[0]).toMatchObject({
    translatedText: "draft",
    proofreadText: "proofread",
    translationNote: "note",
  });
  expect(hook.result.current.saveState.dirty).toBe(true);
  hook.unmount();
});

test("leaving during the initial unit request suppresses cancelled page errors and prefetch", async () => {
  const props = createStoryArgs({ canTranslate: true, canProofread: true });
  let reject = (_error: Error): void => undefined;
  props.onLoadUnits = vi.fn(
    () =>
      new Promise<UnitInfo[]>((_resolve, fail) => {
        reject = fail;
      }),
  );
  props.onPrefetchUnits = vi.fn();
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const hook = renderHook(() => useEditorSession(props));
  await waitFor(() => {
    expect(props.onLoadUnits).toHaveBeenCalledTimes(1);
  });
  hook.unmount();
  await act(async () => {
    reject(new DOMException("cancelled", "AbortError"));
    await Promise.resolve();
  });
  expect(error).not.toHaveBeenCalled();
  expect(props.onPrefetchUnits).not.toHaveBeenCalled();
});
