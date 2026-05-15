import { useState, useEffect, useRef } from "react";
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
import type { UnitDiff, UnitOp } from "../../types/type";
import type { ProofreadPreviewVisibility } from "@/features/BaseTranslator/types/preview";

type PendingAction =
  | { type: "navigate"; newIndex: number }
  | { type: "exit" };

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
  enableReadOnly?: boolean;
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
  enableReadOnly = false,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [unitBuf, setUnitBuf] = useState<UnitInfo[]>([]);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<TranslatorMode>("translate");
  const [proofreadPreviewVisibility, setProofreadPreviewVisibility] =
    useState<ProofreadPreviewVisibility>("visible");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isRelocationEnabled, setIsRelocationEnabled] = useState(false);
  const [isUnitCreationEnabled, setIsUnitCreationEnabled] = useState(true);
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);
  const [isSpecialCharPanelOpen, setIsSpecialCharPanelOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const isNavigating = useRef(false);
  const isSaving = useRef(false);
  const unitBufRef = useRef<UnitInfo[]>([]);
  const baselineUnitsRef = useRef<UnitInfo[]>([]);
  const canvasRef = useRef<CanvasHandle>(null);

  const showToast = useToastStore((s) => s.showToast);

  const { fixedShortcuts, configurableShortcuts, updateConfigurableShortcuts } =
    useShortcuts();

  const activeShortcuts = enableReadOnly
    ? configurableShortcuts.filter((s) =>
        ["nextMarker", "prevMarker", "pageUp", "pageDown"].includes(s.action),
      )
    : configurableShortcuts;

  function normalizedText(val?: string): string | null {
    return val && val !== "" ? val : null;
  }

  function hasPersistedMutation(current: UnitInfo, baseline: UnitInfo): boolean {
    if (current.xCoord !== baseline.xCoord || current.yCoord !== baseline.yCoord) {
      return true;
    }
    if (current.isBubble !== baseline.isBubble) {
      return true;
    }
    if (current.isProofread !== baseline.isProofread) {
      return true;
    }
    if (normalizedText(current.translatedText) !== normalizedText(baseline.translatedText)) {
      return true;
    }
    if (
      normalizedText(current.translatorCommnet) !==
      normalizedText(baseline.translatorCommnet)
    ) {
      return true;
    }
    if ((current.translatorId ?? null) !== (baseline.translatorId ?? null)) {
      return true;
    }
    if (
      normalizedText(current.proofreadText) !==
      normalizedText(baseline.proofreadText)
    ) {
      return true;
    }
    if (
      normalizedText(current.proofreaderComment) !==
      normalizedText(baseline.proofreaderComment)
    ) {
      return true;
    }

    return (current.proofreaderId ?? null) !== (baseline.proofreaderId ?? null);
  }

  function buildCreateOp(unit: UnitInfo): UnitOp {
    const op: UnitOp = {
      localId: unitId(unit),
      xCoord: unit.xCoord,
      yCoord: unit.yCoord,
      isBubble: unit.isBubble,
      isProofread: unit.isProofread,
    };

    const translatedText = normalizedText(unit.translatedText);
    if (translatedText !== null) op.translatedText = translatedText;

    const translatorComment = normalizedText(unit.translatorCommnet);
    if (translatorComment !== null) op.translatorComment = translatorComment;

    if (unit.translatorId !== undefined) {
      op.lastTranslatorId = unit.translatorId;
    }

    const proofreadText = normalizedText(unit.proofreadText);
    if (proofreadText !== null) op.proofreadText = proofreadText;

    const proofreaderComment = normalizedText(unit.proofreaderComment);
    if (proofreaderComment !== null) op.proofreaderComment = proofreaderComment;

    if (unit.proofreaderId !== undefined) {
      op.lastProofreaderId = unit.proofreaderId;
    }

    return op;
  }

  function buildSaveOp(current: UnitInfo, baseline: UnitInfo): UnitOp {
    const op: UnitOp = {
      id: unitId(current),
      xCoord: current.xCoord,
      yCoord: current.yCoord,
      isBubble: current.isBubble,
      isProofread: current.isProofread,
    };

    const currentTranslated = normalizedText(current.translatedText);
    const baselineTranslated = normalizedText(baseline.translatedText);
    if (currentTranslated !== baselineTranslated) {
      op.translatedText = currentTranslated;
    }

    const currentTranslatorComment = normalizedText(current.translatorCommnet);
    const baselineTranslatorComment = normalizedText(baseline.translatorCommnet);
    if (currentTranslatorComment !== baselineTranslatorComment) {
      op.translatorComment = currentTranslatorComment;
    }

    const currentTranslatorId = current.translatorId ?? null;
    const baselineTranslatorId = baseline.translatorId ?? null;
    if (currentTranslatorId !== baselineTranslatorId) {
      op.lastTranslatorId = currentTranslatorId;
    }

    const currentProofread = normalizedText(current.proofreadText);
    const baselineProofread = normalizedText(baseline.proofreadText);
    if (currentProofread !== baselineProofread) {
      op.proofreadText = currentProofread;
    }

    const currentProofreaderComment = normalizedText(current.proofreaderComment);
    const baselineProofreaderComment = normalizedText(baseline.proofreaderComment);
    if (currentProofreaderComment !== baselineProofreaderComment) {
      op.proofreaderComment = currentProofreaderComment;
    }

    const currentProofreaderId = current.proofreaderId ?? null;
    const baselineProofreaderId = baseline.proofreaderId ?? null;
    if (currentProofreaderId !== baselineProofreaderId) {
      op.lastProofreaderId = currentProofreaderId;
    }

    return op;
  }

  function buildUnitDiff(current: UnitInfo[], baseline: UnitInfo[]): UnitDiff {
    const baselineById = new Map(baseline.map((unit) => [unitId(unit), unit]));
    const currentById = new Map(current.map((unit) => [unitId(unit), unit]));
    const ops: UnitOp[] = [];

    for (const unit of current) {
      const baselineUnit = baselineById.get(unitId(unit));

      if (baselineUnit === undefined) {
        ops.push(buildCreateOp(unit));
        continue;
      }

      if (!hasPersistedMutation(unit, baselineUnit)) {
        continue;
      }

      ops.push(buildSaveOp(unit, baselineUnit));
    }

    for (const unit of baseline) {
      if (currentById.has(unitId(unit))) {
        continue;
      }

      ops.push({ id: unitId(unit) });
    }

    return {
      ops,
      candOrder: current.map((unit) => unitId(unit)),
    };
  }

  function isDiffEmpty(diff: UnitDiff): boolean {
    return diff.ops.length === 0;
  }

  function commitUnits(nextUnits: UnitInfo[]) {
    unitBufRef.current = nextUnits;
    setUnitBuf(nextUnits);
  }

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
      baselineUnitsRef.current = units;
      unitBufRef.current = units;
      setUnitBuf(units);
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

  async function flushIfDirty() {
    if (isSaving.current) return;
    const diff = buildUnitDiff(unitBufRef.current, baselineUnitsRef.current);
    if (isDiffEmpty(diff)) return;
    isSaving.current = true;
    try {
      await onSaveUnits(project.pages[pageIndex].id, diff);
      baselineUnitsRef.current = [...unitBufRef.current];
      showToast("保存成功", "success");
    } catch (err) {
      const summary =
        `ops:${diff.ops.length} ` +
        `candOrder:${diff.candOrder.length}`;
      console.error(
        `[BaseTranslator] 保存失败 pageId=${
          project.pages[pageIndex].id
        } diff=${summary}`,
        err,
      );
      showToast("保存失败，请重试", "error");
      throw err;
    } finally {
      isSaving.current = false;
    }
  }

  async function handleNavigate(newIndex: number) {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setPendingAction(null);
    try {
      await flushIfDirty();
      await loadPage(newIndex);
    } catch {
      // 保存失败时阻止翻页，toast 已在 flushIfDirty 中显示
      setPendingAction({ type: "navigate", newIndex });
    } finally {
      isNavigating.current = false;
    }
  }

  async function handleSave() {
    await flushIfDirty();
  }

  async function handleExit() {
    setPendingAction(null);
    try {
      await flushIfDirty();
      onExit();
    } catch {
      // 保存失败时阻止退出，toast 已在 flushIfDirty 中显示
      setPendingAction({ type: "exit" });
    }
  }

  async function handleRetryPendingAction() {
    if (!pendingAction || isNavigating.current) return;
    isNavigating.current = true;

    try {
      await flushIfDirty();

      if (pendingAction.type === "navigate") {
        await loadPage(pendingAction.newIndex);
      } else {
        onExit();
      }

      setPendingAction(null);
    } catch {
      // 保存失败时保持弹窗，toast 已在 flushIfDirty 中显示
    } finally {
      isNavigating.current = false;
    }
  }

  function handleDiscardPendingAction() {
    if (!pendingAction || isNavigating.current) return;

    const action = pendingAction;
    setPendingAction(null);

    if (action.type === "navigate") {
      void loadPage(action.newIndex);
      return;
    }

    onExit();
  }

  function handleModifyUnit(targetUnitId: string, updates: UnitEdit) {
    commitUnits(
      unitBufRef.current.map((unit) =>
        unitId(unit) === targetUnitId ? applyUnitUpdates(unit, updates) : unit,
      ),
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
    );
  }

  function handleAddUnit(xCoord: number, yCoord: number, isBubble: boolean) {
    const newUnit = createUnit(
      xCoord,
      yCoord,
      unitBufRef.current.length,
      isBubble,
    );

    commitUnits([...unitBufRef.current, newUnit]);

    setFocusedUnitId(unitId(newUnit));
  }

  function handleDeleteUnit(targetUnitId: string) {
    const filteredUnits = unitBufRef.current
      .filter((unit) => unitId(unit) !== targetUnitId)
      .map((unit, index) => modifyUnitIndex(unit, index));

    commitUnits(filteredUnits);

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

  useShortcutActions(
    {
      toggleMode: () => {
        if (!isCurrUserProofreader) return;
        setMode((m) => (m === "translate" ? "proofread" : "translate"));
      },
      toggleRelocation: () => {
        setIsRelocationEnabled((v) => !v);
      },
      toggleProofreadPreview: () => {
        if (mode !== "proofread") return;
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
    ...(enableReadOnly
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
    <div className="relative w-full h-full">
      <Canvas
        ref={canvasRef}
        imageSrc={imageUrl}
        units={unitBuf}
        mode={mode}
        isLoading={isLoadingPage}
        isUnitCreationEnabled={enableReadOnly ? false : isUnitCreationEnabled}
        focusedUnitId={focusedUnitId}
        onFocusUnit={setFocusedUnitId}
        onMoveUnit={enableReadOnly ? undefined : handleMoveUnit}
        onAddUnit={enableReadOnly ? undefined : handleAddUnit}
        onDeleteUnit={enableReadOnly ? undefined : handleDeleteUnit}
        enableReadOnly={enableReadOnly}
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
        />
      </div>
    </div>
  );

  const sidebar = (
    <>
      {!enableReadOnly && (
        <div className="flex items-center border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <StatusOptionBar
              currMode={mode}
              enabledModes={
                isCurrUserProofreader ? ["translate", "proofread"] : ["translate"]
              }
              isRelocationEnabled={isRelocationEnabled}
              isUnitCreationEnabled={isUnitCreationEnabled}
              proofreadPreviewVisibility={proofreadPreviewVisibility}
              onTranslateModeClick={() => setMode("translate")}
              onProofreadModeClick={() => setMode("proofread")}
              onRelocationClick={() => setIsRelocationEnabled((v) => !v)}
              onUnitCreationClick={() => setIsUnitCreationEnabled((v) => !v)}
              onToggleProofreadPreviewClick={() =>
                setProofreadPreviewVisibility((v) =>
                  v === "visible" ? "dimmed" : "visible",
                )
              }
              onSaveClick={handleSave}
            />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <UnitList
          units={unitBuf}
          focusedUnitId={focusedUnitId}
          mode={enableReadOnly ? "proofread" : mode}
          onFocusUnit={setFocusedUnitId}
          onModifyUnit={enableReadOnly ? undefined : handleModifyUnit}
          enableReadOnly={enableReadOnly}
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
