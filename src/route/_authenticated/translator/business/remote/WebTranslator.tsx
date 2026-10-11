import type { JSX } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { useBlocker } from "@tanstack/react-router";
import { chapterDraftStore } from "../persistence/draft-store";
import { BaseTranslator } from "@/route/_authenticated/translator/business/BaseTranslator";
import type { UnitSearchTransformDataSource } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import { useReadySession } from "@/route/business/session/ready-session";
import { useApiClient } from "@/route/business/api-context";
import { useTranslatorProject } from "@/route/_authenticated/translator/business/remote/use-translator-project";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import {
  searchChapterUnits,
  transformChapterUnits,
} from "@/route/_authenticated/translator/business/remote/translator-request";
import { useTranslatorApiActions } from "./use-translator-api-actions";
import { useTranslatorTerminology } from "@/route/_authenticated/translator/business/remote/terminology-adapter";

import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import type { EditorProps } from "@/route/_authenticated/translator/business/editor/editor-props";

type TranslatorLoadLifecycle = {
  activeRef: RefObject<boolean>;
  latestLoadsRef: RefObject<Map<string, symbol>>;
};

type Props = {
  chapterId: string;
  startPageId: string;
  onExit: () => void;
  startMode: TranslatorMode | "auto";
};

export function WebTranslator({ chapterId, startPageId, onExit, startMode }: Props): JSX.Element {
  const client = useApiClient();
  const { state, setState } = useTranslatorProject(chapterId);
  const { activeRef, latestLoadsRef } = useTranslatorLoadLifecycle(chapterId);
  const { userInfo: currentUser } = useReadySession();
  const currentUserId = currentUser.id;
  const drafts = useMemo(
    () => chapterDraftStore(currentUserId, chapterId),
    [currentUserId, chapterId],
  );
  const registerLeaveGuard = useTranslatorLeaveGuard();

  const apiActions = useTranslatorApiActions({
    client,
    chapterId,
    currentUser,
    state,
    setState,
    activeRef,
    latestLoadsRef,
  });
  const {
    handleResolveUser,
    handleFetchUnits,
    handleLoadUnits,
    handleSaveUnits,
    handleLoadPageImage,
    handleCompleteStage,
    handleListPageUnitFlaggedStats,
    handleListPageUnitDiffStats,
  } = apiActions;

  const comicId = state.status === "ready" ? state.comicId : undefined;
  const terminology = useTranslatorTerminology(comicId);

  const unitSearchTransform = useTranslatorSearchSource(client, chapterId, handleFetchUnits);

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
      key={`${chapterId}:${currentUserId}`}
      drafts={drafts}
      canWrite={state.canTranslate || state.canProofread}
      registerLeaveGuard={registerLeaveGuard}
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

function useTranslatorLoadLifecycle(chapterId: string): TranslatorLoadLifecycle {
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
  return { activeRef, latestLoadsRef };
}

function useTranslatorLeaveGuard(): NonNullable<EditorProps["registerLeaveGuard"]> {
  const leaveGuardRef = useRef<(() => Promise<boolean>) | null>(null);
  const registerLeaveGuard = useCallback((guard: (() => Promise<boolean>) | null) => {
    leaveGuardRef.current = guard;
  }, []);
  useBlocker({
    shouldBlockFn: () => leaveGuardRef.current?.() ?? false,
    enableBeforeUnload: false,
  });
  return registerLeaveGuard;
}

function useTranslatorSearchSource(
  client: ReturnType<typeof useApiClient>,
  chapterId: string,
  handleFetchUnits: UnitSearchTransformDataSource["reloadPage"],
): UnitSearchTransformDataSource {
  return useMemo(
    () => ({
      search: (args) => searchChapterUnits(client, chapterId, args),
      transform: (args) => transformChapterUnits(client, chapterId, args),
      reloadPage: handleFetchUnits,
    }),
    [chapterId, client, handleFetchUnits],
  );
}
