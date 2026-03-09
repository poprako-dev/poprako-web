import { useState, useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import Paginator from "@/components/ui/Paginator";
import { isUnitSame, type Unit } from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";
import type { Project } from "@/types/project";
import Canvas, {
  type CanvasHandle,
} from "@/features/BaseTranslator/features/Canvas";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import BaseTranslatorLayout from "@/features/BaseTranslator/layout/BaseTranslatorLayout";
import StatusOptionBar from "./StatusOptionBar";

type Props = {
  project: Project;
  // 懒加载的 units 获取器，BaseTranslator 只负责在需要时调用它来获取 units 列表
  onLoadUnits: (pageId: string) => Promise<Unit[]>;
  // 具体是否是 upsert 由实现决定，BaseTranslator 只负责传递修改后的 units 列表
  // BaseTranslator 为了减少 IO，采用内置 buffer 来缓存当前页的 units 的修改
  // onUpsertUnits 的默认调用时机是：翻页时、退出 BaseTranslator 时，
  // 以及一个手动的 "保存" 按钮被按下时
  onUpsertUnits: (pageId: string, units: Unit[]) => Promise<void>;
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
  onUpsertUnits,
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
  const [isRelocationEnabled, setIsRelocationEnabled] = useState(true);

  const isDirty = useRef(false);
  const isNavigating = useRef(false);
  const unitBufRef = useRef<Unit[]>([]);
  const baselineUnitsRef = useRef<Unit[]>([]);
  const canvasRef = useRef<CanvasHandle>(null);

  function withCleanState(units: Unit[]): Unit[] {
    return units.map((unit) => ({ ...unit, isDirty: false }));
  }

  function withDirtyFlags(units: Unit[], baseline: Unit[]): Unit[] {
    const baselineById = new Map(baseline.map((unit) => [unit.id, unit]));

    return units.map((unit) => {
      const base = baselineById.get(unit.id);
      const nextDirty = !base || !isUnitSame(unit, base);
      return { ...unit, isDirty: nextDirty };
    });
  }

  function hasUnitChanges(units: Unit[], baseline: Unit[]): boolean {
    if (units.length !== baseline.length) {
      return true;
    }

    const baselineById = new Map(baseline.map((unit) => [unit.id, unit]));
    for (const unit of units) {
      const base = baselineById.get(unit.id);
      if (!base || !isUnitSame(unit, base)) {
        return true;
      }
    }

    return false;
  }

  function commitUnits(nextUnits: Unit[]) {
    const nextWithDirty = withDirtyFlags(nextUnits, baselineUnitsRef.current);
    unitBufRef.current = nextWithDirty;
    isDirty.current = hasUnitChanges(nextWithDirty, baselineUnitsRef.current);
    setUnitBuf(nextWithDirty);
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
      const cleanUnits = withCleanState(units);
      baselineUnitsRef.current = cleanUnits;
      unitBufRef.current = cleanUnits;
      setUnitBuf(cleanUnits);
      setImageUrl(img);
      setFocusedUnitId(undefined);
      isDirty.current = false;
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
    if (!isDirty.current) return;
    await onUpsertUnits(project.pages[pageIndex].id, unitBufRef.current);
    const cleanUnits = withCleanState(unitBufRef.current);
    baselineUnitsRef.current = cleanUnits;
    unitBufRef.current = cleanUnits;
    setUnitBuf(cleanUnits);
    isDirty.current = false;
  }

  async function handleNavigate(newIndex: number) {
    if (isNavigating.current) return;
    isNavigating.current = true;
    try {
      await flushIfDirty();
      await loadPage(newIndex);
    } finally {
      isNavigating.current = false;
    }
  }

  async function handleSave() {
    await flushIfDirty();
  }

  async function handleExit() {
    await flushIfDirty();
    onExit();
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
      proved: false,
    };
    commitUnits([...unitBufRef.current, { ...newUnit, isDirty: true }]);
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

  // Tab / Shift+Tab to cycle focused unit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (unitBuf.length === 0) return;

      e.preventDefault();

      const currentIndex = unitBuf.findIndex((u) => u.id === focusedUnitId);
      let nextIndex: number;

      if (e.shiftKey) {
        nextIndex = currentIndex <= 0 ? unitBuf.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= unitBuf.length - 1 ? 0 : currentIndex + 1;
      }

      setFocusedUnitId(unitBuf[nextIndex].id);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [unitBuf, focusedUnitId]);

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
        <button
          onClick={handleExit}
          title="退出"
          className={
            "p-1.5 shrink-0 border-l border-border " +
            "text-muted-foreground hover:text-foreground transition-colors"
          }
        >
          <LogOut size={14} />
        </button>
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

  return <BaseTranslatorLayout canvas={canvas} sidebar={sidebar} />;
}
