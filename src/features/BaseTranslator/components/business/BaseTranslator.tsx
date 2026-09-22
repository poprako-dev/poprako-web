/* eslint-disable no-console, eqeqeq, unicorn/no-non-function-verb-prefix */
/* eslint-disable unicorn/no-unnecessary-global-this, unicorn/prefer-minimal-ternary */
/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @eslint-react/use-state, @eslint-react/exhaustive-deps */
import { useState, useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import { showLocalCaughtError } from "@/api/util";
import {
  SquareArrowRight,
  Command,
  CaseSensitive,
  Check,
  Loader2,
  ReplaceAll,
} from "lucide-react";
import TranslatorPaginator from
  "../../features/PageUnitStats/components/business/TranslatorPaginator";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ToolboxDropdown from "@/features/ToolboxDropdown";
import {
  applyUnitUpdates,
  createUnit,
  moveUnitToIndex,
  modifyUnitPosition,
  unitPosition,
  unitId,
  unitIsBubble,
  unitTranslatedText,
  unitProofreadText,
  type UnitInfo,
  type UnitEdit,
} from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";
import type { Project } from "@/types/project";
import type { PageImageQuality, PageUnitDiffStats, PageUnitFlaggedStats } from "@/types/page";
import Canvas, {
  type CanvasHandle,
} from "@/features/BaseTranslator/features/Canvas";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import BaseTranslatorLayout from "@/features/BaseTranslator/layout/BaseTranslatorLayout";
import ShortcutPanel from "@/features/BaseTranslator/features/ShortcutPanel";
import SpecialCharPanel from "@/features/BaseTranslator/features/SpecialCharPanel";
import TerminologyLookupBar from "@/features/BaseTranslator/features/TerminologyLookup";
import UnitSearchTransformDialog from
  "@/features/BaseTranslator/features/UnitSearchTransform";
import StatusOptionBar from "./StatusOptionBar";
import { useShortcuts } from "@/features/BaseTranslator/hook/useShortcuts";
import { useShortcutActions } from "@/features/BaseTranslator/hook/useShortcutActions";
import { shouldIgnoreTranslatorKey } from "@/features/BaseTranslator/hook/keyboardScope";
import { useRelocationPreference } from
  "@/features/BaseTranslator/hook/useRelocationPreference";
import { useToastStore } from "@/components/ui/NotificationToast";
import { useSpecialChars } from "@/hook/useSpecialChars";
import type { ProofreadPreviewVisibility } from "@/features/BaseTranslator/types/preview";
import type {
  SpecialCharInsertRequest,
} from "@/features/BaseTranslator/features/UnitList/components/business/UnitList";
import type { SaveUnits } from "../../types/type";
import type { TerminologyDataSource } from "../../types/terminology";
import type {
  UnitSearchTransformDataSource,
  UnitTextPart,
} from "../../types/unitSearchTransform";
import type { UnitUserResolver } from "../../features/UnitList/hook/unitContributorCache";
import { useUnitPersistence } from "../../hook/useUnitPersistence";
import {
  resolveInitialPageIndex,
  usePageImagePreloader,
} from "../../hook/usePageImagePreloader";
import ReadOnlyPageActions from
  "../../features/PageUnitStats/components/business/ReadOnlyPageActions";
import {
  availableTranslatorModes,
  initialTranslatorMode,
  translatorCompletionStage,
  type TranslatorCompletionStage,
} from "../../types/access";

interface Props {
  project: Project;
  // 懒加载的 units 获取器，BaseTranslator 只负责在需要时调用它来获取 units 列表
  onLoadUnits: (pageId: string) => Promise<UnitInfo[]>;
  // 具体是否是 upsert 由实现决定，BaseTranslator 只负责传递修改后的 units 列表
  // BaseTranslator 为了减少 IO，采用内置 buffer 来缓存当前页的 units 的修改
  // onUpsertUnits 的默认调用时机是：翻页时、退出 BaseTranslator 时，
  // 以及一个手动的 "保存" 按钮被按下时
  onSaveUnits: SaveUnits;
  // 懒加载的图片 URL 获取器，BaseTranslator 只负责在需要时调用它来获取图片 URL
  onLoadPageImage: (
    pageId: string,
    quality: PageImageQuality,
  ) => Promise<string>;
  onResolveUser: UnitUserResolver;
  onCompleteStage: (stage: TranslatorCompletionStage) => Promise<void>;
  onListPageUnitDiffStats: () => Promise<PageUnitDiffStats[]>;
  onListPageUnitFlaggedStats: () => Promise<PageUnitFlaggedStats[]>;
  onExit: () => void;
  currentUserId: string;
  canTranslate: boolean;
  canProofread: boolean;
  terminology: TerminologyDataSource;
  unitSearchTransform: UnitSearchTransformDataSource;
  startPageId: string;
  startMode: TranslatorMode | "auto";
}

interface TranslatorViewState {
  entryMode: TranslatorMode;
  view: TranslatorMode;
}

function initialViewState(entryMode: TranslatorMode): TranslatorViewState {
  return {
    entryMode,
    view: entryMode,
  };
}

export default function BaseTranslator({
  project,
  onLoadUnits,
  onSaveUnits,
  onLoadPageImage,
  onResolveUser,
  onCompleteStage,
  onListPageUnitDiffStats,
  onListPageUnitFlaggedStats,
  onExit,
  currentUserId,
  canTranslate,
  canProofread,
  terminology,
  unitSearchTransform,
  startPageId,
  startMode,
}: Props) {
  const initialPageIndex = resolveInitialPageIndex(project.pages, startPageId);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [unitBuf, setUnitBuf] = useState<UnitInfo[]>([]);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(
    undefined,
  );
  const availableModes = useMemo(
    () => availableTranslatorModes({ canTranslate, canProofread }),
    [canProofread, canTranslate],
  );
  const mode = useMemo(
    () => initialTranslatorMode(
      availableModes,
      startMode === "auto" ? undefined : startMode,
    ),
    [availableModes, startMode],
  );
  const [storedViewState, setViewState] = useState<TranslatorViewState>(() =>
    initialViewState(mode),
  );
  const viewState = storedViewState.entryMode === mode
    ? storedViewState
    : initialViewState(mode);
  if (storedViewState !== viewState) {
    setViewState(viewState);
  }
  const { view } = viewState;
  const [proofreadPreviewVisibility, setProofreadPreviewVisibility] =
    useState<ProofreadPreviewVisibility>("visible");

  const isReadOnly = view === "readOnly";
  const canSwitchView = mode !== "readOnly" && availableModes.length > 1;
  const nextView = availableModes[
    (availableModes.indexOf(view) + 1) % availableModes.length
  ];
  const canEditView = !isReadOnly && (
    view === "translate" ? canTranslate : canProofread
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHighResolution, setIsHighResolution] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const imageQuality: PageImageQuality = isHighResolution
    ? "original"
    : "optimized";
  const { isRelocationEnabled, toggleRelocation } = useRelocationPreference();
  const [isUnitCreationEnabled, setIsUnitCreationEnabled] = useState(true);
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);
  const [isSpecialCharPanelOpen, setIsSpecialCharPanelOpen] = useState(false);
  const [isUnitSearchTransformOpen, setIsUnitSearchTransformOpen] =
    useState(false);
  const [specialCharInsertRequest, setSpecialCharInsertRequest] =
    useState<SpecialCharInsertRequest | undefined>(undefined);
  const [deleteConfirmUnitId, setDeleteConfirmUnitId] = useState<
    string | undefined
  >(undefined);
  const [isCompletingStage, setIsCompletingStage] = useState(false);
  const [hasCompletedStage, setHasCompletedStage] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [isPageStatsOpen, setIsPageStatsOpen] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);
  const lastSpecialCharRef = useRef<string | null>(null);
  const relocationSuppressedUnitIdRef = useRef<string | null>(null);
  const pendingCenteredUnitIdRef = useRef<string | null>(null);

  const showToast = useToastStore((s) => s.showToast);
  const { allChars, favoriteChars } = useSpecialChars();

  usePageImagePreloader({
    pages: project.pages,
    currentPageIndex: pageIndex,
    quality: imageQuality,
    onLoadPageImage,
  });

  const { fixedShortcuts, configurableShortcuts, updateConfigurableShortcuts } =
    useShortcuts();

  const activeShortcuts = (() => {
    let shortcuts = configurableShortcuts;
    if (isReadOnly) {
      shortcuts = shortcuts.filter((s) =>
        [
          "nextMarker", "prevMarker", "pageUp", "pageDown",
          "toggleMode", "toggleProofreadPreview",
        ].includes(s.action),
      );
    }
    shortcuts = shortcuts.filter((s) => s.action !== "toggleMode");
    return shortcuts;
  })();

  const {
    unitBufRef,
    pendingAction,
    saving,
    saveState,
    runExclusive,
    refreshUnits,
    commitUnits,
    setLoadedUnits,
    flushIfDirty,
    handleNavigate,
    handleExit,
    handleRetryPendingAction,
    handleDiscardPendingAction,
  } = useUnitPersistence({
    onSaveUnits,
    onReloadUnits: onLoadUnits,
    onExit,
    showToast,
    loadPage,
    setUnitBuf,
    autoSaveEnabled: !isLoadingPage && !isReadOnly && !isUnitSearchTransformOpen
      && !isCompletingStage,
  });

  const pageLoadGenerationRef = useRef(0);

  useEffect(() => () => { pageLoadGenerationRef.current += 1; }, []);

  async function loadPage(idx: number, targetUnitId?: string) {
    const page = project.pages[idx];
    if (!page) {return;}
    const generation = ++pageLoadGenerationRef.current;
    setIsLoadingPage(true);
    try {
      const [units, img] = await Promise.all([
        onLoadUnits(page.id),
        onLoadPageImage(page.id, imageQuality),
      ]);
      if (generation !== pageLoadGenerationRef.current) {return;}
      setPageIndex(idx);
      setLoadedUnits(page.id, units);
      setImageUrl(img);
      relocationSuppressedUnitIdRef.current = null;
      pendingCenteredUnitIdRef.current = targetUnitId ?? null;
      setFocusedUnitId(targetUnitId);
    } finally {
      if (generation === pageLoadGenerationRef.current) {setIsLoadingPage(false);}
    }
  }

  useEffect(() => {
    if (project.pages.length > 0) {
      void loadPage(initialPageIndex).catch((error) => {
        console.error("[BaseTranslator] 初始页面加载失败", error);
        showLocalCaughtError(error, showToast, "页面加载失败，请重试");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    try {
      await flushIfDirty();
    } catch {
      // The persistence coordinator already reports and retains failed saves.
    }
  }

  async function handleToggleImageQuality() {
    const isNextIsHighResolution = !isHighResolution;
    const page = project.pages[pageIndex];
    if (!page) {return;}

    const generation = ++pageLoadGenerationRef.current;
    setIsHighResolution(isNextIsHighResolution);
    setIsLoadingPage(true);
    setImageUrl(null);
    try {
      const nextImageUrl = await onLoadPageImage(
        page.id,
        isNextIsHighResolution ? "original" : "optimized",
      );
      if (generation === pageLoadGenerationRef.current) {setImageUrl(nextImageUrl);}
    } catch (error) {
      console.error("[BaseTranslator] 图片加载失败", error);
      showLocalCaughtError(error, showToast, "图片加载失败，请重试");
    } finally {
      if (generation === pageLoadGenerationRef.current) {setIsLoadingPage(false);}
    }
  }

  async function handleCompleteStage() {
    if (
      !completionStage ||
      isCompletingStage ||
      hasCompletedStage
    ) {
      return;
    }

    setIsCompletingStage(true);
    try {
      await runExclusive(() => onCompleteStage(completionStage));
      setHasCompletedStage(true);
      setIsCompleteConfirmOpen(false);
      showToast(
        completionStage === "proofread" ? "校对已完成" : "翻译已完成",
        "success",
      );
    } catch (error) {
      console.error("[BaseTranslator] 推进译校阶段失败", {
        stage: completionStage,
        error,
      });
      showLocalCaughtError(error, showToast, "推进阶段失败，请重试");
    } finally {
      setIsCompletingStage(false);
    }
  }

  function handleQuickSpecialChar() {
    const char = lastSpecialCharRef.current ?? allChars[0]?.text;
    if (!char || !focusedUnitId) {return;}

    setSpecialCharInsertRequest((prev) => ({
      id: (prev?.id ?? 0) + 1,
      char,
      targetUnitId: focusedUnitId,
    }));
  }

  function handleQuickSpecialCharAt(index: number) {
    return () => {
      const char = favoriteChars[index];
      if (!char || !focusedUnitId) {return;}

      setSpecialCharInsertRequest((prev) => ({
        id: (prev?.id ?? 0) + 1,
        char,
        targetUnitId: focusedUnitId,
      }));
    };
  }

  function handleSpecialCharUse(char: string) {
    lastSpecialCharRef.current = char;
  }

  function handleSpecialCharInserted(requestId: number, char: string) {
    lastSpecialCharRef.current = char;
    setSpecialCharInsertRequest((request) =>
      request?.id === requestId ? undefined : request,
    );
  }

  function handleModifyUnit(targetUnitId: string, updates: UnitEdit) {
    if (isLoadingPage || isCompletingStage) {return;}
    if (updates.isFlagged !== undefined && Object.keys(updates).length === 1) {
      commitUnits(
        unitBufRef.current.map((unit) =>
          unitId(unit) === targetUnitId ? applyUnitUpdates(unit, updates) : unit,
        ),
        setUnitBuf,
      );
      return;
    }
    const nextUpdates = { ...updates };
    const currentUnit = unitBufRef.current.find(
      (unit) => unitId(unit) === targetUnitId,
    );
    const currentTranslatedText = currentUnit
      ? unitTranslatedText(currentUnit)
      : null;

    if (updates.translatedText?.trim()) {
      nextUpdates.translatorId = currentUserId;
    }

    // FIXME: 服务端应从认证 token 写入编辑者，并迁移历史缺失作者的数据。
    // 当前协议会拒绝带翻译文本却没有翻译者的完整 unit payload，先以当前用户兜底。
    if (currentTranslatedText?.trim() && !currentUnit?.translatorId) {
      nextUpdates.translatorId = currentUserId;
    }

    if (updates.proofreadText?.trim()) {
      nextUpdates.proofreaderId = currentUserId;
    }

    commitUnits(
      unitBufRef.current.map((unit) =>
        unitId(unit) === targetUnitId ? applyUnitUpdates(unit, nextUpdates) : unit,
      ),
      setUnitBuf,
    );
  }

  function handleMoveUnit(
    targetUnitId: string,
    xCoord: number,
    yCoord: number,
  ) {
    commitUnits(
      unitBufRef.current.map((unit) =>
        unitId(unit) === targetUnitId
          ? modifyUnitPosition(unit, xCoord, yCoord)
          : unit,
      ),
      setUnitBuf,
    );
  }

  function handleReorderUnit(targetUnitId: string, targetIndex: number) {
    commitUnits(
      moveUnitToIndex(unitBufRef.current, targetUnitId, targetIndex),
      setUnitBuf,
    );
  }

  function handleAddUnit(xCoord: number, yCoord: number, isBubble: boolean) {
    if (isLoadingPage || isCompletingStage) {return;}
    if (unitBufRef.current.length >= 100) {
      showToast("每页最多 100 个文本块", "error");
      return;
    }
    const newUnit = createUnit(
      xCoord,
      yCoord,
      isBubble,
    );

    commitUnits([...unitBufRef.current, newUnit], setUnitBuf);

    const newUnitId = unitId(newUnit);
    relocationSuppressedUnitIdRef.current = newUnitId;
    setFocusedUnitId(newUnitId);
  }

  function handleFocusUnit(targetUnitId: string) {
    if (targetUnitId !== focusedUnitId) {
      relocationSuppressedUnitIdRef.current = null;
    }
    setFocusedUnitId(targetUnitId);
  }

  function handlePageImageLoad() {
    const targetUnitId = pendingCenteredUnitIdRef.current;
    if (!targetUnitId) {return;}

    const unit = unitBufRef.current.find((item) => unitId(item) === targetUnitId);
    if (!unit) {return;}

    pendingCenteredUnitIdRef.current = null;
    const position = unitPosition(unit);
    canvasRef.current?.centerOn(position.xCoord, position.yCoord);
  }

  async function handleRefreshCurrentPage() {
    await refreshUnits();
  }

  async function handleSearchResultNavigate(
    pageId: string,
    targetUnitId?: string,
  ) {
    const targetIndex = project.pages.findIndex((page) => page.id === pageId);
    if (targetIndex === -1) {
      console.error("[BaseTranslator] 搜索结果页面不存在", { pageId });
      showToast("目标页面已不存在，请重新进入翻译器", "error");
      return;
    }

    await handleNavigate(targetIndex, targetUnitId);
  }

  function doDeleteUnit(targetUnitId: string) {
    if (isLoadingPage || isCompletingStage) {return;}
    const filteredUnits = unitBufRef.current
      .filter((unit) => unitId(unit) !== targetUnitId);

    commitUnits(filteredUnits, setUnitBuf);

    if (focusedUnitId === targetUnitId) {
      setFocusedUnitId(undefined);
    }
  }

  function handleDeleteUnit(targetUnitId: string) {
    const unit = unitBufRef.current.find((u) => unitId(u) === targetUnitId);
    if (
      unit &&
      (unitTranslatedText(unit) != null || unitProofreadText(unit) != null)
    ) {
      setDeleteConfirmUnitId(targetUnitId);
      return;
    }
    doDeleteUnit(targetUnitId);
  }

  // Relocation: when focused unit changes and relocation is on, center canvas on it
  useEffect(() => {
    if (!isRelocationEnabled || !focusedUnitId) {return;}
    if (relocationSuppressedUnitIdRef.current === focusedUnitId) {return;}

    const unit = unitBufRef.current.find((item) => unitId(item) === focusedUnitId);
    if (!unit) {return;}
    const position = unitPosition(unit);

    canvasRef.current?.centerOn(position.xCoord, position.yCoord);
  }, [focusedUnitId, isRelocationEnabled, unitBufRef]);

  function handleSwitchView() {
    if (!canSwitchView) {return;}
    setIsPageStatsOpen(false);
    setViewState((current) => {
      const currentIndex = availableModes.indexOf(current.view);
      const next = availableModes[(currentIndex + 1) % availableModes.length]!;
      return {
        entryMode: mode,
        view: next,
      };
    });
  }

  useShortcutActions(
    {
      toggleMode: handleSwitchView,
      toggleRelocation,
      toggleProofreadPreview: () => {
        setProofreadPreviewVisibility((v) =>
          v === "visible" ? "dimmed" : "visible",
        );
      },
      nextMarker: () => {
        if (unitBuf.length === 0) {return;}
        const cur = unitBuf.findIndex((unit) => unitId(unit) === focusedUnitId);
        const next = cur >= unitBuf.length - 1 ? 0 : cur + 1;
        handleFocusUnit(unitId(unitBuf[next]!));
      },
      prevMarker: () => {
        if (unitBuf.length === 0) {return;}
        const cur = unitBuf.findIndex((unit) => unitId(unit) === focusedUnitId);
        const prev = cur <= 0 ? unitBuf.length - 1 : cur - 1;
        handleFocusUnit(unitId(unitBuf[prev]!));
      },
      pageUp: () => {
        if (pageIndex > 0) {handleNavigate(pageIndex - 1);}
      },
      pageDown: () => {
        if (pageIndex < project.pages.length - 1) {
          handleNavigate(pageIndex + 1);
        }
      },
      quickSpecialChar: handleQuickSpecialChar,
      quickSpecialChar1: handleQuickSpecialCharAt(0),
      quickSpecialChar2: handleQuickSpecialCharAt(1),
      quickSpecialChar3: handleQuickSpecialCharAt(2),
      save: () => {
        void handleSave();
      },
    },
    activeShortcuts,
    isShortcutPanelOpen || isSpecialCharPanelOpen || isUnitSearchTransformOpen
      || (isReadOnly && isPageStatsOpen),
  );

  useEffect(() => {
    if (
      isShortcutPanelOpen || isSpecialCharPanelOpen || isUnitSearchTransformOpen
      || (isReadOnly && isPageStatsOpen)
    ) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreTranslatorKey(e)) {return;}
      if (e.key === "Escape") {
        setFocusedUnitId(undefined);
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => { globalThis.removeEventListener("keydown", handleKeyDown); };
  }, [
    isShortcutPanelOpen, isSpecialCharPanelOpen, isUnitSearchTransformOpen,
    isReadOnly, isPageStatsOpen,
  ]);

  const toolboxOptions = isReadOnly ? [] : [
    {
      icon: <Command size={20} />,
      title: "快捷键说明",
      onClick: () => { setIsShortcutPanelOpen(true); },
    },
    {
      icon: <CaseSensitive size={20} />,
      title: "特殊符号面板",
      onClick: () => { setIsSpecialCharPanelOpen(true); },
    },
    {
      icon: <ReplaceAll size={20} />,
      title: "搜索与替换",
      onClick: () => { setIsUnitSearchTransformOpen(true); },
    },
  ];

  const unitSearchPart: UnitTextPart = view === "translate"
    ? "translatedText"
    : "proofreadText";

  const completionStage = translatorCompletionStage({
    canTranslate,
    canProofread,
  });

  const canvas = (
    <div className="@container relative w-full h-full bg-stone-700">
      <Canvas
        ref={canvasRef}
        imageSrc={imageUrl}
        units={unitBuf}
        mode={view}
        isLoading={isLoadingPage}
        isUnitCreationEnabled={canEditView ? isUnitCreationEnabled : false}
        focusedUnitId={focusedUnitId}
        onFocusUnit={handleFocusUnit}
        onMoveUnit={canEditView ? handleMoveUnit : undefined}
        onAddUnit={canEditView ? handleAddUnit : undefined}
        onDeleteUnit={canEditView ? handleDeleteUnit : undefined}
        onToggleBubble={
          canEditView ? (targetId) =>
            {
              const targetUnit = unitBufRef.current.find((u) => unitId(u) === targetId);
              if (targetUnit) {
                handleModifyUnit(targetId, { isBubble: !unitIsBubble(targetUnit) });
              }
            }
            : undefined
        }
        onImageLoad={handlePageImageLoad}
        enableReadOnly={!canEditView || isLoadingPage || isCompletingStage}
        proofreadPreviewVisibility={proofreadPreviewVisibility}
      />
      {!isReadOnly && (
        <TerminologyLookupBar dataSource={terminology} />
      )}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        {!isReadOnly && (
          <ToolboxDropdown options={toolboxOptions} direction="down" />
        )}
        <button
          type="button"
          title="退出"
          aria-label="退出翻译器"
          onClick={handleExit}
          className={clsx(
            "flex size-8 items-center justify-center rounded-md border",
            "border-gray-200 bg-white/85 text-gray-700 shadow-sm",
            "transition-colors hover:bg-white hover:text-gray-900",
          )}
        >
          <SquareArrowRight size={20} />
        </button>
      </div>
      {!isReadOnly && completionStage && (
        <div className="absolute bottom-2 right-2">
          <button
            type="button"
            title={completionStage === "proofread" ? "完成校对" : "完成翻译"}
            aria-label={completionStage === "proofread" ? "完成校对" : "完成翻译"}
            disabled={isLoadingPage || isCompletingStage || hasCompletedStage}
            onClick={() => { setIsCompleteConfirmOpen(true); }}
            className={clsx(
              "flex size-8 items-center justify-center rounded-md border",
              "border-gray-200 bg-white/85 text-gray-700 shadow-sm",
              "transition-colors hover:border-green-200 hover:bg-green-50",
              "hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isCompletingStage ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      )}
      {isReadOnly && (
        <div className="absolute bottom-2 right-2">
          <ReadOnlyPageActions
            key={project.id}
            pages={project.pages}
            currentPageId={project.pages[pageIndex]!.id}
            isDisabled={isLoadingPage || saving}
            isOpen={isPageStatsOpen}
            onOpenChange={setIsPageStatsOpen}
            onListPageUnitDiffStats={onListPageUnitDiffStats}
            onNavigate={handleNavigate}
          />
        </div>
      )}
      <div className="absolute top-2 right-2">
        <TranslatorPaginator
          key={`${project.id}-${String(isReadOnly)}`}
          pages={project.pages}
          currentPageIndex={pageIndex}
          currentUnits={isLoadingPage ? undefined : unitBuf}
          isEnabled={!isReadOnly}
          onLoad={onListPageUnitFlaggedStats}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );

  function saveStatusLabel() {
    if (saveState.error) {
      return saveState.refreshError ? "已保存，刷新失败" : "保存失败，修改已保留";
    }
    if (saving) {return "保存中";}
    return saveState.dirty ? "待保存" : "已保存";
  }

  const sidebar = (
    <>
      <div className="flex items-center border-b-2 border-stone-200 shrink-0 bg-stone-50">
        <div className="flex-1 min-w-0">
          <StatusOptionBar
            currMode={view}
            view={view}
            nextView={nextView!}
            canSwitchView={canSwitchView}
            isRelocationEnabled={isRelocationEnabled}
            isUnitCreationEnabled={isUnitCreationEnabled}
            proofreadPreviewVisibility={proofreadPreviewVisibility}
            isHighResolution={isHighResolution}
            isLoadingPage={isLoadingPage}
            onSwitchView={handleSwitchView}
            onRelocationClick={toggleRelocation}
            onUnitCreationClick={() => { setIsUnitCreationEnabled((v) => !v); }}
            onToggleProofreadPreviewClick={() =>
              { setProofreadPreviewVisibility((v) =>
                v === "visible" ? "dimmed" : "visible",
              ); }
            }
            onToggleImageQualityClick={handleToggleImageQuality}
            onSaveClick={handleSave}
            saving={saving}
            saveStatus={saveStatusLabel()}
          />
        </div>
      </div>
      <div
        className={clsx(
          "flex-1 overflow-y-auto bg-stone-100",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        )}
      >
        <UnitList
          units={unitBuf}
          focusedUnitId={focusedUnitId}
          mode={view}
          onFocusUnit={handleFocusUnit}
          onModifyUnit={canEditView ? handleModifyUnit : undefined}
          onReorderUnit={canEditView ? handleReorderUnit : undefined}
          onResolveUser={onResolveUser}
          enableReadOnly={!canEditView || isLoadingPage || isCompletingStage}
          specialCharInsertRequest={specialCharInsertRequest}
          onSpecialCharUse={handleSpecialCharUse}
          onSpecialCharInserted={handleSpecialCharInserted}
        />
      </div>
    </>
  );

  return (
    <>
      <BaseTranslatorLayout canvas={canvas} sidebar={sidebar} />
      {isShortcutPanelOpen && (
        <ShortcutPanel
          fixedShortcuts={fixedShortcuts}
          configurableShortcuts={configurableShortcuts}
          onUpdateConfigurableShortcuts={updateConfigurableShortcuts}
          onClose={() => { setIsShortcutPanelOpen(false); }}
        />
      )}
      {isSpecialCharPanelOpen && (
        <SpecialCharPanel onClose={() => { setIsSpecialCharPanelOpen(false); }} />
      )}
      {isUnitSearchTransformOpen && (
        <UnitSearchTransformDialog
          pages={project.pages}
          part={unitSearchPart}
          currentPageId={project.pages[pageIndex]!.id}
          dataSource={unitSearchTransform}
          onBeforeSearch={() => flushIfDirty(false)}
          runExclusive={runExclusive}
          onRefreshCurrentPage={handleRefreshCurrentPage}
          onNavigate={handleSearchResultNavigate}
          onClose={() => { setIsUnitSearchTransformOpen(false); }}
        />
      )}
      {pendingAction && (
        <ConfirmDialog
          title="保存失败，是否继续？"
          description="可以选择再次重试保存；或放弃本页未保存修改并继续操作。"
          confirmLabel="再次重试"
          cancelLabel="放弃并继续"
          loading={saving}
          onConfirm={handleRetryPendingAction}
          onCancel={handleDiscardPendingAction}
        />
      )}
      {deleteConfirmUnitId != null && (
        <ConfirmDialog
          title="确认删除"
          description="该文本块包含已翻译或已校对内容，删除后不可恢复。确定要删除吗？"
          confirmLabel="删除"
          cancelLabel="取消"
          onConfirm={() => {
            doDeleteUnit(deleteConfirmUnitId);
            setDeleteConfirmUnitId(undefined);
          }}
          onCancel={() => { setDeleteConfirmUnitId(undefined); }}
        />
      )}
      {isCompleteConfirmOpen && completionStage && (
        <ConfirmDialog
          title={completionStage === "proofread" ? "确认完成校对" : "确认完成翻译"}
          description={
            completionStage === "proofread"
              ? "确认将当前章节的校对阶段标记为已完成吗？" +
                "未保存内容会先自动保存。"
              : "确认将当前章节的翻译阶段标记为已完成吗？" +
                "未保存内容会先自动保存。"
          }
          confirmLabel="确认完成"
          cancelLabel="取消"
          confirmTone="success"
          loading={isCompletingStage}
          onConfirm={handleCompleteStage}
          onCancel={() => {
            if (!isCompletingStage) {setIsCompleteConfirmOpen(false);}
          }}
        />
      )}
    </>
  );
}
