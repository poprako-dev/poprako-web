import { useState, useEffect } from "react";
import type { Unit } from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";
import Canvas from "@/features/BaseTranslator/features/Canvas";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import BaseTranslatorLayout from "@/features/BaseTranslator/layout/BaseTranslatorLayout";

type Props = {
  imageSrc: string | null;
  initialUnits?: Unit[];
};

export default function BaseTranslator({ imageSrc, initialUnits = [] }: Props) {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<TranslatorMode>("translate");

  function handleModifyUnit(unitId: string, updates: Partial<Unit>) {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, ...updates } : u)),
    );
  }

  function handleMoveUnit(unitId: string, xCoord: number, yCoord: number) {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, xCoord, yCoord } : u)),
    );
  }

  function handleAddUnit(xCoord: number, yCoord: number, isBubble: boolean) {
    const newUnit: Unit = {
      id: crypto.randomUUID(),
      index: units.length,
      isBubble,
      xCoord,
      yCoord,
      proved: false,
    };
    setUnits((prev) => [...prev, newUnit]);
    setFocusedUnitId(newUnit.id);
  }

  function handleDeleteUnit(unitId: string) {
    setUnits((prev) => {
      const filtered = prev.filter((u) => u.id !== unitId);
      return filtered.map((u, i) => ({ ...u, index: i }));
    });
    if (focusedUnitId === unitId) {
      setFocusedUnitId(undefined);
    }
  }

  // Tab / Shift+Tab to cycle focused unit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (units.length === 0) return;

      e.preventDefault();

      const currentIndex = units.findIndex((u) => u.id === focusedUnitId);
      let nextIndex: number;

      if (e.shiftKey) {
        nextIndex = currentIndex <= 0 ? units.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= units.length - 1 ? 0 : currentIndex + 1;
      }

      setFocusedUnitId(units[nextIndex].id);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [units, focusedUnitId]);

  const canvas = (
    <Canvas
      imageSrc={imageSrc}
      units={units}
      mode={mode}
      focusedUnitId={focusedUnitId}
      onFocusUnit={setFocusedUnitId}
      onMoveUnit={handleMoveUnit}
      onAddUnit={handleAddUnit}
      onDeleteUnit={handleDeleteUnit}
    />
  );

  const sidebar = (
    <>
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-border shrink-0">
        <button
          onClick={() => setMode("translate")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === "translate"
              ? "bg-green-50 text-green-500"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          翻译
        </button>
        <button
          onClick={() => setMode("proofread")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === "proofread"
              ? "bg-green-50 text-green-500"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          校对
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <UnitList
          units={units}
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
