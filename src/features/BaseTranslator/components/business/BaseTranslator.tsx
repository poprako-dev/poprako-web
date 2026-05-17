import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { SquareArrowRight, Command, CaseSensitive } from "lucide-react";
import Paginator from "@/components/ui/Paginator";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ToolboxDropdown from "@/features/ToolboxDropdown";
import {
  applyUnitUpdates,
  createUnit,
  modifyUnitIndex,
  modifyUnitPosition,
  unitPosition,
  unitId,
  type UnitInfo,
  type UnitEdit,
} from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";
import type { Project } from "@/types/project";
import Canvas, {
  type CanvasHandle,
} from "@/features/BaseTranslator/features/Canvas";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import BaseTranslatorLayout from "@/features/BaseTranslator/layout/BaseTranslatorLayout";
import ShortcutPanel from "@/features/BaseTranslator/features/ShortcutPanel";
import SpecialCharPanel from "@/features/BaseTranslator/features/SpecialCharPanel";
import StatusOptionBar from "./StatusOptionBar";
import { useShortcuts } from "@/features/BaseTranslator/hook/useShortcuts";
import { useShortcutActions } from "@/features/BaseTranslator/hook/useShortcutActions";
import { useToastStore } from "@/components/ui/NotificationToast";
import type { ProofreadPreviewVisibility } from "@/features/BaseTranslator/types/preview";
import type { UnitDiff } from "../../types/type";
import { useUnitPersistence } from "../../hook/useUnitPersistence";

type Props = {
  project: Project;
  // 懒加载的 units 获取器，BaseTranslator 只负责在需要时调用它来获取 units 列表
  onLoadUnits: (pageId: string) => Promise<UnitInfo[]>;
  // 具体是否是 upsert 由实现决定，BaseTranslator 只负责传递修改后的 units 列表
  // BaseTranslator 为了减少 IO，采用内置 buffer 来缓存当前页的 units 的修改
  // onUpsertUnits 的默认调用时机是：翻页时、退出 BaseTranslator 时，
  // 以及一个手动的 "保存" 按钮被按下时
  onSaveUnits: (pageId: string, diff: UnitDiff) => Promise<void>;
  // 懒加载的图片 URL 获取器，BaseTranslator 只负责在需要时调用它来获取图片 URL
  onLoadPageImage: (pageId: string) => Promise<string>;
  onExit: () => void;
  // 如果当前用户是校对，则允许切换到校对模式
  // 否则只能使用翻译模式
  isCurrUserProofreader: boolean;
  // 初始页码索引，默认为 0
  startPageIndex?: number;
  // 初始页 ID，优先级高于 startPageIndex
  startPageId?: string;
  startMode?: TranslatorMode;
};

export default function BaseTranslator({
  project,
  onLoadUnits,
  onSaveUnits,
  onLoadPageImage,
  onExit,
  isCurrUserProofreader,
  startPageIndex,
  startPageId,
  startMode,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [unitBuf, setUnitBuf] = useState<UnitInfo[]>([]);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<TranslatorMode>(startMode ?? "translate");
  const [proofreadPreviewVisibility, setProofreadPreviewVisibility] =
    useState<ProofreadPreviewVisibility>("visible");

  const displayMode = mode === "readOnly" ? "proofread" : mode;
  const readOnly = mode === "readOnly";
  const availableModes: TranslatorMode[] = isCurrUserProofreader
    ? ["translate", "proofread", "readOnly"]
    : [startMode ?? "translate"];
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isRelocationEnabled, setIsRelocationEnabled] = useState(false);
  const [isUnitCreationEnabled, setIsUnitCreationEnabled] = useState(true);
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);
  const [isSpecialCharPanelOpen, setIsSpecialCharPanelOpen] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);

  const showToast = useToastStore((s) => s.showToast);

  const { fixedShortcuts, configurableShortcuts, updateConfigurableShortcuts } =
    useShortcuts();

  const activeShortcuts = (() => {
    let shortcuts = configurableShortcuts;
    if (readOnly) {
      shortcuts = shortcuts.filter((s) =>
        [
          "nextMarker", "prevMarker", "pageUp", "pageDown",
          "toggleMode", "toggleProofreadPreview",
        ].includes(s.action),
      );
    }
    if (availableModes.length <= 1) {
      shortcuts = shortcuts.filter((s) => s.action !== "toggleMode");
    }
    return shortcuts;
  })();

  const {
    unitBufRef,
    pendingAction,
    saving,
    commitUnits,
    setLoadedUnits,
    flushIfDirty,
    handleNavigate,
    handleExit,
    handleRetryPendingAction,
    handleDiscardPendingAction,
  } = useUnitPersistence({
    getPageId: () => project.pages[pageIndex].id,
    onSaveUnits,
    onExit,
    showToast,
    loadPage,
  });

  async function loadPage(idx: number) {
    const page = project.pages[idx];
    setPageIndex(idx);
    setIsLoadingPage(true);
    setImageUrl(null);
    try {
      const [units, img] = await Promise.all([
        onLoadUnits(page.id),
        onLoadPageImage(page.id),
      ]);
      setLoadedUnits(units, setUnitBuf);
      setImageUrl(img);
      setFocusedUnitId(undefined);
    } finally {
      setIsLoadingPage(false);
    }
  }

  useEffect(() => {
    if (project.pages.length > 0) {
      let initial = 0;

      if (startPageId) {
        const idxById = project.pages.findIndex((page) => page.id === startPageId);
        if (idxById >= 0) {
          initial = idxById;
        }
      } else if (
        startPageIndex !== undefined &&
        startPageIndex >= 0 &&
        startPageIndex < project.pages.length
      ) {
        initial = startPageIndex;
      }

      loadPage(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    await flushIfDirty();
  }

  function handleModifyUnit(targetUnitId: string, updates: UnitEdit) {
    commitUnits(
      unitBufRef.current.map((unit) =>
        unitId(unit) === targetUnitId ? applyUnitUpdates(unit, updates) : unit,
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

  function handleAddUnit(xCoord: number, yCoord: number, isBubble: boolean) {
    const newUnit = createUnit(
      xCoord,
      yCoord,
      unitBufRef.current.length,
      isBubble,
    );

    commitUnits([...unitBufRef.current, newUnit], setUnitBuf);

    setFocusedUnitId(unitId(newUnit));
  }

  function handleDeleteUnit(targetUnitId: string) {
    const filteredUnits = unitBufRef.current
      .filter((unit) => unitId(unit) !== targetUnitId)
      .map((unit, index) => modifyUnitIndex(unit, index));

    commitUnits(filteredUnits, setUnitBuf);

    if (focusedUnitId === targetUnitId) {
      setFocusedUnitId(undefined);
    }
  }

  // Relocation: when focused unit changes and relocation is on, center canvas on it
  useEffect(() => {
    if (!isRelocationEnabled || !focusedUnitId) return;
    const unit = unitBuf.find((item) => unitId(item) === focusedUnitId);
    if (!unit) return;
    const position = unitPosition(unit);

    canvasRef.current?.centerOn(position.xCoord, position.yCoord);
  }, [focusedUnitId, isRelocationEnabled, unitBuf]);

  function getNextMode(
    current: TranslatorMode,
    isProofreader: boolean,
  ): TranslatorMode {
    if (isProofreader) {
      if (current === "translate") return "proofread";
      if (current === "proofread") return "readOnly";
      return "translate";
    }
    if (current === "translate") return "readOnly";
    return "translate";
  }

  function handleCycleMode() {
    const next = getNextMode(mode, isCurrUserProofreader);
    if (mode === "proofread" && next === "readOnly") {
      flushIfDirty()
        .then(() => setMode(next))
        .catch(() => {});
    } else {
      setMode(next);
    }
  }

  useShortcutActions(
    {
      toggleMode: () => {
        const next = getNextMode(mode, isCurrUserProofreader);
        if (mode === "proofread" && next === "readOnly") {
          flushIfDirty()
            .then(() => setMode(next))
            .catch(() => {});
        } else {
          setMode(next);
        }
      },
      toggleRelocation: () => {
        setIsRelocationEnabled((v) => !v);
      },
      toggleProofreadPreview: () => {
        setProofreadPreviewVisibility((v) =>
          v === "visible" ? "dimmed" : "visible",
        );
      },
      nextMarker: () => {
        if (unitBuf.length === 0) return;
        const cur = unitBuf.findIndex((unit) => unitId(unit) === focusedUnitId);
        const next = cur >= unitBuf.length - 1 ? 0 : cur + 1;
        setFocusedUnitId(unitId(unitBuf[next]));
      },
      prevMarker: () => {
        if (unitBuf.length === 0) return;
        const cur = unitBuf.findIndex((unit) => unitId(unit) === focusedUnitId);
        const prev = cur <= 0 ? unitBuf.length - 1 : cur - 1;
        setFocusedUnitId(unitId(unitBuf[prev]));
      },
      pageUp: () => {
        if (pageIndex > 0) handleNavigate(pageIndex - 1);
      },
      pageDown: () => {
        if (pageIndex < project.pages.length - 1) {
          handleNavigate(pageIndex + 1);
        }
      },
    },
    activeShortcuts,
    isShortcutPanelOpen,
  );

  useEffect(() => {
    if (isShortcutPanelOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedUnitId(undefined);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutPanelOpen]);

  const toolboxOptions = [
    ...(readOnly
      ? []
      : [
          {
            icon: <Command size={20} />,
            title: "快捷键说明",
            onClick: () => setIsShortcutPanelOpen(true),
          },
          {
            icon: <CaseSensitive size={20} />,
            title: "特殊符号面板",
            onClick: () => setIsSpecialCharPanelOpen(true),
          },
        ]),
    {
      icon: <SquareArrowRight size={20} />,
      title: "退出",
      onClick: handleExit,
    },
  ];

  const canvas = (
    <div className="relative w-full h-full bg-stone-100">
      <Canvas
        ref={canvasRef}
        imageSrc={imageUrl}
        units={unitBuf}
        mode={displayMode}
        isLoading={isLoadingPage}
        isUnitCreationEnabled={readOnly ? false : isUnitCreationEnabled}
        focusedUnitId={focusedUnitId}
        onFocusUnit={setFocusedUnitId}
        onMoveUnit={readOnly ? undefined : handleMoveUnit}
        onAddUnit={readOnly ? undefined : handleAddUnit}
        onDeleteUnit={readOnly ? undefined : handleDeleteUnit}
        enableReadOnly={readOnly}
        proofreadPreviewVisibility={proofreadPreviewVisibility}
      />
      <div className="absolute top-2 left-2">
        <ToolboxDropdown options={toolboxOptions} />
      </div>
      <div className="absolute top-2 right-2">
        <Paginator
          currPageIndex={pageIndex}
          totalPageCount={project.pages.length}
          onPageIndexChange={handleNavigate}
          onPageUp={() => handleNavigate(pageIndex - 1)}
          onPageDown={() => handleNavigate(pageIndex + 1)}
          pageStats={project.pages.map((p) => ({
            totalUnits: p.totalUnitCount,
            translatedUnits: p.translatedUnitCount,
            proofreadUnits: p.proofreadUnitCount,
          }))}
        />
      </div>
    </div>
  );

  const sidebar = (
    <>
      <div className="flex items-center border-b border-stone-200 shrink-0 bg-stone-50">
        <div className="flex-1 min-w-0">
          <StatusOptionBar
            currMode={mode}
            availableModes={availableModes}
            isRelocationEnabled={isRelocationEnabled}
            isUnitCreationEnabled={isUnitCreationEnabled}
            proofreadPreviewVisibility={proofreadPreviewVisibility}
            onCycleMode={handleCycleMode}
            onRelocationClick={() => setIsRelocationEnabled((v) => !v)}
            onUnitCreationClick={() => setIsUnitCreationEnabled((v) => !v)}
            onToggleProofreadPreviewClick={() =>
              setProofreadPreviewVisibility((v) =>
                v === "visible" ? "dimmed" : "visible",
              )
            }
            onSaveClick={handleSave}
            saving={saving}
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
          mode={displayMode}
          onFocusUnit={setFocusedUnitId}
          onModifyUnit={readOnly ? undefined : handleModifyUnit}
          enableReadOnly={readOnly}
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
          onClose={() => setIsShortcutPanelOpen(false)}
        />
      )}
      {isSpecialCharPanelOpen && (
        <SpecialCharPanel onClose={() => setIsSpecialCharPanelOpen(false)} />
      )}
      {pendingAction && (
        <ConfirmDialog
          title="保存失败，是否继续？"
          description="可以选择再次重试保存；或放弃本页未保存修改并继续操作。"
          confirmLabel="再次重试"
          cancelLabel="放弃并继续"
          onConfirm={handleRetryPendingAction}
          onCancel={handleDiscardPendingAction}
        />
      )}
    </>
  );
}
