import { useCallback, useEffect, useMemo } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";
import { useAppStore } from "@/route/business/session/session-store";
import { toApiRequestError } from "@/route/business/request-error";
import type { DraftStore } from "../persistence/draft-store";
import type { UnitInfo } from "../unit/unit";
import type { SaveUnits, UnitDiff } from "../contract/type";
import type { UnitSearchTransformDataSource } from "../contract/unit-search-transform";
import { PageUnitSource } from "./page-unit-source";
import { listUnits, saveUnits, transformChapterUnits } from "./translator-request";
import {
  aggregateProjectCounters,
  mergePageCounters,
  type TranslatorProjectState,
} from "./use-translator-project";

type Options = {
  client: ApiClient;
  chapterId: string;
  currentUser: { id: string };
  drafts: DraftStore;
  state: TranslatorProjectState;
  setState: Dispatch<SetStateAction<TranslatorProjectState>>;
  activeRef: RefObject<boolean>;
  latestLoadsRef: RefObject<Map<string, symbol>>;
};

export type PageUnitActions = {
  handleFetchUnits: (pageId: string) => Promise<Result<UnitInfo[]>>;
  handleLoadUnits: (pageId: string) => Promise<UnitInfo[]>;
  handleReloadUnits: (pageId: string) => Promise<UnitInfo[]>;
  handlePrefetchUnits: (pageId: string) => void;
  handleSaveUnits: SaveUnits;
  handleTransformUnits: UnitSearchTransformDataSource["transform"];
};

export function usePageUnitSource(
  client: ApiClient,
  chapterId: string,
  userId: string,
): PageUnitSource {
  const generation = useAppStore((state) => state.generation);
  const scope = useMemo(
    () => ({ client, chapterId, userId, generation }),
    [client, chapterId, userId, generation],
  );
  const source = useMemo(
    () => new PageUnitSource((id, signal) => listUnits(scope.client, id, signal)),
    [scope],
  );
  useEffect(
    () => () => {
      source.clear();
    },
    [source],
  );
  return source;
}

export function usePageUnitActions(options: Options): PageUnitActions {
  const { client, chapterId, currentUser } = options;
  const source = usePageUnitSource(client, chapterId, currentUser.id);
  const fetchUnits = useUnitFetcher(options, source);
  const handleLoadUnits = useCallback(
    (id: string) => requireUnits(id, fetchUnits(id)),
    [fetchUnits],
  );
  const handleReloadUnits = useCallback(
    (id: string) => requireUnits(id, fetchUnits(id, true)),
    [fetchUnits],
  );
  const handleFetchUnits = useCallback((id: string) => fetchUnits(id, true), [fetchUnits]);
  const handleSaveUnits = useCallback<SaveUnits>(
    (id, diff, saveId) =>
      source.mutate(id, () => requireSave(id, diff, saveUnits(client, id, diff, saveId))),
    [client, source],
  );
  const handleTransformUnits = useCallback<UnitSearchTransformDataSource["transform"]>(
    (args) => source.mutate(undefined, () => transformChapterUnits(client, chapterId, args)),
    [chapterId, client, source],
  );
  return {
    handleFetchUnits,
    handleLoadUnits,
    handleReloadUnits,
    handlePrefetchUnits: useNeighborPrefetch(options, source),
    handleSaveUnits,
    handleTransformUnits,
  };
}

function useUnitFetcher(
  options: Options,
  source: PageUnitSource,
): (pageId: string, fresh?: boolean) => Promise<Result<UnitInfo[]>> {
  const { chapterId, setState, activeRef, latestLoadsRef } = options;
  return useCallback(
    async (pageId, fresh = false) => {
      const generation = Symbol();
      latestLoadsRef.current.set(pageId, generation);
      const result = await source.read(pageId, fresh);
      if (!result.success) return result;
      setState((previous) => {
        if (
          !activeRef.current ||
          previous.status !== "ready" ||
          previous.project.id !== chapterId ||
          latestLoadsRef.current.get(pageId) !== generation
        )
          return previous;
        const pages = mergePageCounters(previous.project.pages, pageId, result.data);
        return {
          ...previous,
          project: { ...previous.project, pages, ...aggregateProjectCounters(pages) },
        };
      });
      return { success: true, data: result.data.units };
    },
    [activeRef, chapterId, latestLoadsRef, setState, source],
  );
}

function useNeighborPrefetch(options: Options, source: PageUnitSource): (pageId: string) => void {
  const { state, drafts } = options;
  return useCallback(
    (pageId) => {
      if (state.status !== "ready") return;
      const pages = state.project.pages;
      const index = pages.findIndex((page) => page.id === pageId);
      if (index === -1) return;
      source.prefetch(
        [pages[index + 1]?.id, pages[index - 1]?.id].filter(
          (id): id is string => id !== undefined && !drafts.getState().drafts[id],
        ),
      );
    },
    [drafts, source, state],
  );
}

async function requireUnits(
  pageId: string,
  request: Promise<Result<UnitInfo[]>>,
): Promise<UnitInfo[]> {
  const result = await request;
  if (result.success) return result.data;
  if (result.failureKind !== "aborted") {
    console.error("[WebTranslator] 加载单页单位失败", { pageId, error: result.error });
  }
  throw toApiRequestError(result);
}

async function requireSave(
  pageId: string,
  diff: UnitDiff,
  request: ReturnType<typeof saveUnits>,
): ReturnType<SaveUnits> {
  const result = await request;
  if (result.success) return result.data;
  console.error("[WebTranslator] 保存单页单位失败", { pageId, diff, error: result.error });
  throw toApiRequestError(result);
}
