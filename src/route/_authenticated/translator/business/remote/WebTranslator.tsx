import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { BaseTranslator } from "@/route/_authenticated/translator/business/BaseTranslator";
import type { UnitSearchTransformDataSource } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import type {
  UnitDiff,
  UnitSaveResult,
} from "@/route/_authenticated/translator/business/contract/type";
import type { PageImageQuality } from "@/route/_authenticated/business/page/page";
import { useReadySession } from "@/route/business/session/ready-session";
import { useApiClient } from "@/route/business/api-context";
import {
  listPageUnitDiffStats,
  listPageUnitFlaggedStats,
} from "@/route/_authenticated/business/page/page-request";
import { completeChapterStage } from "@/route/_authenticated/business/chapter/chapter-request";
import {
  aggregateProjectCounters,
  mergePageCounters,
  useTranslatorProject,
} from "@/route/_authenticated/translator/business/remote/use-translator-project";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import {
  listUnits,
  saveUnits,
  searchChapterUnits,
  transformChapterUnits,
} from "@/route/_authenticated/translator/business/remote/translator-request";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { getUser } from "@/route/business/identity/user-request";
import type { UserInfo } from "@/route/business/identity/user";
import type { Result } from "@/shared/utility/result";
import { toApiRequestError } from "@/route/business/request-error";
import { selectPageImageUrl } from "@/route/_authenticated/translator/business/remote/page-image";
import { useTranslatorTerminology } from "@/route/_authenticated/translator/business/remote/terminology-adapter";

import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import type { TranslatorCompletionStage } from "@/route/_authenticated/translator/business/contract/access";

type Props = {
  chapterId: string;
  startPageId: string;
  onExit: () => void;
  startMode: TranslatorMode | "auto";
};

export function WebTranslator({
  chapterId,
  startPageId,
  onExit,
  startMode,
}: Props): TranslatorImportedType0.Element {
  const client = useApiClient();
  const { state, setState } = useTranslatorProject(chapterId);
  const activeRef = useRef(false);
  const latestLoadsRef = useRef(new Map<string, symbol>());
  useEffect(() => {
    activeRef.current = true;
    const loads = latestLoadsRef.current;
    return () => {
      activeRef.current = false;
      loads.clear();
    };
  }, [chapterId]);
  const { userInfo: currentUser } = useReadySession();
  const currentUserId = currentUser.id;

  const handleResolveUser = useCallback(
    async (userId: string): Promise<Result<UserInfo>> => {
      if (currentUser.id === userId) {
        return { success: true as const, data: currentUser };
      }

      return await getUser(client, userId);
    },
    [client, currentUser],
  );

  const handleFetchUnits = useCallback(
    async (pageId: string) => {
      const generation = Symbol();
      latestLoadsRef.current.set(pageId, generation);
      const result = await listUnits(client, pageId);
      if (!result.success) return result;

      setState((prev) => {
        if (
          !activeRef.current ||
          prev.status !== "ready" ||
          prev.project.id !== chapterId ||
          latestLoadsRef.current.get(pageId) !== generation
        )
          return prev;

        const nextPages = mergePageCounters(prev.project.pages, pageId, {
          totalUnitCount: result.data.totalUnitCount,
          translatedUnitCount: result.data.translatedUnitCount,
          proofreadUnitCount: result.data.proofreadUnitCount,
        });
        const counters = aggregateProjectCounters(nextPages);

        return {
          ...prev,
          project: {
            ...prev.project,
            pages: nextPages,
            ...counters,
          },
        };
      });

      return {
        success: true as const,
        data: [...result.data.units].sort((lhs, rhs) => lhs.index - rhs.index),
      };
    },
    [chapterId, client, setState],
  );

  const handleLoadUnits = useCallback(
    async (pageId: string) => {
      const result = await handleFetchUnits(pageId);
      if (!result.success) {
        console.error("[WebTranslator] 加载单页单位失败", {
          pageId,
          error: result.error,
        });
        throw toApiRequestError(result);
      }

      return result.data;
    },
    [handleFetchUnits],
  );

  const handleSaveUnits = useCallback(
    async (pageId: string, diff: UnitDiff, saveId: string): Promise<UnitSaveResult> => {
      const result = await saveUnits(client, pageId, diff, saveId);
      if (!result.success) {
        console.error("[WebTranslator] 保存单页单位失败", { pageId, diff, error: result.error });
        throw toApiRequestError(result);
      }
      return result.data;
    },
    [client],
  );

  const handleLoadPageImage = useCallback(
    async (pageId: string, quality: PageImageQuality): Promise<string> => {
      // Page URLs are already available in project.pages. Optimized loading
      // falls back to the original while older servers are still in use.
      if (state.status === "ready") {
        const page = state.project.pages.find((p) => p.id === pageId);
        if (page) return selectPageImageUrl(page, quality);
      }
      // Fallback: fetch pages again
      const result = await listPages(client, { chapterId });
      if (result.success) {
        const page = result.data.find((p) => p.id === pageId);
        if (page) return selectPageImageUrl(page, quality);
        throw new Error(`[WebTranslator] 页面 ${pageId} 不属于章节 ${chapterId}`);
      }
      throw toApiRequestError(result);
    },
    [chapterId, client, state],
  );

  const handleCompleteStage = useCallback(
    async (stage: TranslatorCompletionStage) => {
      const result = await completeChapterStage(client, chapterId, {
        stage,
        oper: "advance",
      });
      if (!result.success) throw toApiRequestError(result);
    },
    [chapterId, client],
  );

  const handleListPageUnitFlaggedStats = useCallback(async () => {
    const result = await listPageUnitFlaggedStats(client, chapterId);
    if (!result.success) throw toApiRequestError(result);
    return result.data;
  }, [chapterId, client]);

  const handleListPageUnitDiffStats = useCallback(async () => {
    const result = await listPageUnitDiffStats(client, chapterId);
    if (!result.success) throw toApiRequestError(result);
    return result.data;
  }, [chapterId, client]);

  const comicId = state.status === "ready" ? state.comicId : undefined;
  const terminology = useTranslatorTerminology(comicId);

  const unitSearchTransform = useMemo<UnitSearchTransformDataSource>(
    () => ({
      search: (args) => searchChapterUnits(client, chapterId, args),
      transform: (args) => transformChapterUnits(client, chapterId, args),
      reloadPage: handleFetchUnits,
    }),
    [chapterId, client, handleFetchUnits],
  );

  if (state.status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingCircle />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className={
          "flex h-screen w-full flex-col items-center " + "justify-center gap-4 bg-background"
        }
      >
        <p className="text-sm text-destructive">{state.message}</p>
        <button
          type="button"
          onClick={onExit}
          className={
            "text-sm text-muted-foreground hover:text-foreground " + "transition-colors underline"
          }
        >
          返回
        </button>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background">
        <p role="alert" className="text-sm text-destructive">
          登录状态已失效，请返回后重新登录。
        </p>
        <button
          type="button"
          onClick={onExit}
          className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
        >
          返回
        </button>
      </div>
    );
  }
  if (!terminology) {
    throw new Error("[WebTranslator] 缺少术语数据源");
  }

  return (
    <BaseTranslator
      key={chapterId}
      project={state.project}
      onLoadUnits={handleLoadUnits}
      onSaveUnits={handleSaveUnits}
      onLoadPageImage={handleLoadPageImage}
      onResolveUser={handleResolveUser}
      onCompleteStage={handleCompleteStage}
      onListPageUnitDiffStats={handleListPageUnitDiffStats}
      onListPageUnitFlaggedStats={handleListPageUnitFlaggedStats}
      onExit={onExit}
      currentUserId={currentUserId}
      canTranslate={state.canTranslate}
      canProofread={state.canProofread}
      terminology={terminology}
      unitSearchTransform={unitSearchTransform}
      startPageId={startPageId}
      startMode={startMode}
    />
  );
}
