import { useState, useEffect, useRef } from "react";
import { SquareArrowRight, Command, ReplaceAll } from "lucide-react";
import Paginator from "@/components/ui/Paginator";
import ToolboxDropdown from "@/features/ToolboxDropdown";
import { isUnitSame, type Unit } from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";
import type { Project } from "@/types/project";
import Canvas, {
  type CanvasHandle,
} from "@/features/BaseTranslator/features/Canvas";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import BaseTranslatorLayout from "@/features/BaseTranslator/layout/BaseTranslatorLayout";
import ShortcutPanel from "@/features/BaseTranslator/features/ShortcutPanel";
import StatusOptionBar from "./StatusOptionBar";
import { useShortcuts } from "@/features/BaseTranslator/hook/useShortcuts";
import { useShortcutActions } from "@/features/BaseTranslator/hook/useShortcutActions";
import { useToastStore } from "@/components/ui/NotificationToast";
import type { UnitDiff, UnitPatch } from "../../types/type";

type Props = {
  project: Project;
  // 懒加载的 units 获取器，BaseTranslator 只负责在需要时调用它来获取 units 列表
  onLoadUnits: (pageId: string) => Promise<Unit[]>;
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
};

export default function BaseTranslator({
  project,
  onLoadUnits,
  onSaveUnits,
  onLoadPageImage,
  onExit,
  isCurrUserProofreader,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [unitBuf, setUnitBuf] = useState<Unit[]>([]);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<TranslatorMode>("translate");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isRelocationEnabled, setIsRelocationEnabled] = useState(false);
  const [isShortcutPanelOpen, setIsShortcutPanelOpen] = useState(false);

  const isNavigating = useRef(false);
  const isSaving = useRef(false);
  const unitBufRef = useRef<Unit[]>([]);
  const baselineUnitsRef = useRef<Unit[]>([]);
  const canvasRef = useRef<CanvasHandle>(null);

  const showToast = useToastStore((s) => s.showToast);

  const { fixedShortcuts, configurableShortcuts, updateConfigurableShortcuts } =
    useShortcuts();

  function buildUnitPatch(current: Unit, baseline: Unit): UnitPatch {
    const patch: UnitPatch = { id: current.id };
    (Object.keys(current) as (keyof Unit)[]).forEach((key) => {
      if (key !== "id" && current[key] !== baseline[key]) {
        (patch as Record<string, unknown>)[key] = current[key];
      }
    });
    return patch;
  }

  function buildUnitDiff(current: Unit[], baseline: Unit[]): UnitDiff {
    const baselineById = new Map(baseline.map((u) => [u.id, u]));
    const currentById = new Map(current.map((u) => [u.id, u]));

    const insert = current.filter((u) => !baselineById.has(u.id));
    const modify = current
      .filter((u) => {
        const base = baselineById.get(u.id);
        return base !== undefined && !isUnitSame(u, base);
      })
      .map((u) => buildUnitPatch(u, baselineById.get(u.id)!));
    const del = baseline.filter((u) => !currentById.has(u.id)).map((u) => u.id);

    return { insert, modify, delete: del };
  }

  function isDiffEmpty(diff: UnitDiff): boolean {
    return (
      diff.insert.length === 0 &&
      diff.modify.length === 0 &&
      diff.delete.length === 0
    );
  }

  function commitUnits(nextUnits: Unit[]) {
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
      loadPage(0);
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
      baselineUnitsRef.current = unitBufRef.current;
    } catch (err) {
      const summary =
        `insert:${diff.insert.length} ` +
        `modify:${diff.modify.length} ` +
        `delete:${diff.delete.length}`;
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
    try {
      await flushIfDirty();
      await loadPage(newIndex);
    } catch {
      // 保存失败时阻止翻页，toast 已在 flushIfDirty 中显示
    } finally {
      isNavigating.current = false;
    }
  }

  async function handleSave() {
    await flushIfDirty();
  }

  async function handleExit() {
    try {
      await flushIfDirty();
      onExit();
    } catch {
      // 保存失败时阻止退出，toast 已在 flushIfDirty 中显示
    }
  }

  function handleModifyUnit(unitId: string, updates: Partial<Unit>) {
    commitUnits(
      unitBufRef.current.map((unit) =>
        unit.id === unitId ? { ...unit, ...updates } : unit,
      ),
    );
  }

  function handleMoveUnit(unitId: string, xCoord: number, yCoord: number) {
    commitUnits(
      unitBufRef.current.map((unit) =>
        unit.id === unitId ? { ...unit, xCoord, yCoord } : unit,
      ),
    );
  }

  function handleAddUnit(xCoord: number, yCoord: number, isBubble: boolean) {
    const newUnit: Unit = {
      id: crypto.randomUUID(),
      index: unitBufRef.current.length,
      isBubble,
      xCoord,
      yCoord,
      isProofread: false,
    };
    commitUnits([...unitBufRef.current, newUnit]);
    setFocusedUnitId(newUnit.id);
  }

  function handleDeleteUnit(unitId: string) {
    const filteredUnits = unitBufRef.current
      .filter((unit) => unit.id !== unitId)
      .map((unit, index) => ({ ...unit, index }));

    commitUnits(filteredUnits);

    if (focusedUnitId === unitId) {
      setFocusedUnitId(undefined);
    }
  }

  // Relocation: when focused unit changes and relocation is on, center canvas on it
  useEffect(() => {
    if (!isRelocationEnabled || !focusedUnitId) return;
    const unit = unitBuf.find((u) => u.id === focusedUnitId);
    if (!unit) return;
    canvasRef.current?.centerOn(unit.xCoord, unit.yCoord);
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
      nextMarker: () => {
        if (unitBuf.length === 0) return;
        const cur = unitBuf.findIndex((u) => u.id === focusedUnitId);
        const next = cur >= unitBuf.length - 1 ? 0 : cur + 1;
        setFocusedUnitId(unitBuf[next].id);
      },
      prevMarker: () => {
        if (unitBuf.length === 0) return;
        const cur = unitBuf.findIndex((u) => u.id === focusedUnitId);
        const prev = cur <= 0 ? unitBuf.length - 1 : cur - 1;
        setFocusedUnitId(unitBuf[prev].id);
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
    configurableShortcuts,
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
    {
      icon: <Command size={20} />,
      title: "快捷键说明",
      onClick: () => setIsShortcutPanelOpen(true),
    },
    {
      icon: <ReplaceAll size={20} />,
      title: "批量替换",
      onClick: () => {},
    },
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
        focusedUnitId={focusedUnitId}
        onFocusUnit={setFocusedUnitId}
        onMoveUnit={handleMoveUnit}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
      />
      <div className="absolute top-2 left-2">
        <ToolboxDropdown options={toolboxOptions} />
      </div>
      <div className="absolute top-2 right-1">
        <Paginator
          currPageIndex={pageIndex}
          totalPageCount={project.pages.length}
          onPageIndexChange={handleNavigate}
          onPageUp={() => handleNavigate(pageIndex - 1)}
          onPageDown={() => handleNavigate(pageIndex + 1)}
        />
      </div>
      {isLoadingPage && (
        <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">加载中…</span>
        </div>
      )}
    </div>
  );

  const sidebar = (
    <>
      <div className="flex items-center border-b border-border shrink-0">
        <div className="flex-1 min-w-0">
          <StatusOptionBar
            currMode={mode}
            enabledModes={
              isCurrUserProofreader ? ["translate", "proofread"] : ["translate"]
            }
            isRelocationEnabled={isRelocationEnabled}
            onTranslateModeClick={() => setMode("translate")}
            onProofreadModeClick={() => setMode("proofread")}
            onRelocationClick={() => setIsRelocationEnabled((v) => !v)}
            onSaveClick={handleSave}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <UnitList
          units={unitBuf}
          focusedUnitId={focusedUnitId}
          mode={mode}
          onFocusUnit={setFocusedUnitId}
          onModifyUnit={handleModifyUnit}
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
    </>
  );
}
