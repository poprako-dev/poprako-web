import clsx from "clsx";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  unitId,
  unitIndex,
  unitIsBubble,
  type UnitInfo,
} from "@/types/unit";
import UnitContributorTooltip, {
  type UnitContributor,
} from "./UnitContributorTooltip";

interface Props {
  unit: UnitInfo;
  isFocused: boolean;
  onIndexActivate?: ((unitId: string) => void) | undefined;
  canToggleBubble?: boolean | undefined;
  onIndexPointerDown?: ((
    event: ReactPointerEvent<HTMLButtonElement>,
    unitId: string,
  ) => void) | undefined;
  isDragging?: boolean | undefined;
  isDragDimmed?: boolean | undefined;
  showDropIndicator?: boolean | undefined;
  enableReadOnly?: boolean | undefined;
  contributors: UnitContributor[];
  children: React.ReactNode;
  dataUnitId?: string | undefined;
}

export default function BaseUnitItem({
  unit,
  isFocused,
  onIndexActivate,
  canToggleBubble = false,
  onIndexPointerDown,
  isDragging = false,
  isDragDimmed = false,
  showDropIndicator = false,
  enableReadOnly = false,
  contributors,
  children,
  dataUnitId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isBubble = unitIsBubble(unit);

  useEffect(() => {
    if (isFocused && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isFocused]);

  const canReorder = onIndexPointerDown !== undefined;
  let indexTitle = "点击选择 Unit";
  if (enableReadOnly && !canReorder) {
    indexTitle = "点击选择 Unit；只读模式下不可调整顺序";
  } else if (canReorder) {
    indexTitle = canToggleBubble
      ? "轻触切换气泡状态，拖动序号调整顺序"
      : "拖动序号调整顺序";
  } else if (canToggleBubble) {
    indexTitle = "轻触切换气泡状态";
  }
  const activateIndex = () => onIndexActivate?.(unitId(unit));

  return (
    <div
      ref={containerRef}
      data-unit-id={dataUnitId}
      className={clsx(
        "relative flex cursor-text items-stretch border-y border-stone-200",
        "first:border-t-0 last:border-b-0 transition-all duration-75",
        isFocused
          ? "z-10 bg-stone-300/50"
          : "bg-transparent hover:bg-stone-100/70",
        isDragDimmed && "bg-stone-100/60 opacity-40 grayscale",
        isDragging && [
          "z-20 bg-stone-50 opacity-100",
          "outline outline-1 outline-[var(--color-green-500)] shadow-md",
        ],
      )}
    >
      {showDropIndicator && (
        <div
          className={clsx(
            "pointer-events-none absolute -top-0.5 right-0 left-0 z-30 h-1",
            "rounded-full bg-[var(--color-green-500)] shadow-md",
          )}
        />
      )}
      <div
        className={clsx(
          "transition-all duration-150 shrink-0",
          "border-l-4",
          isBubble ? "border-pink-300" : "border-amber-300",
        )}
      />

      <button
        type="button"
        onPointerDown={
          canReorder
            ? (event) => { onIndexPointerDown(event, unitId(unit)); }
            : undefined
        }
        onClick={
          canReorder
            ? (event) => {
                if (event.detail === 0) {activateIndex();}
              }
            : activateIndex
        }
        onContextMenu={(event) => { event.preventDefault(); }}
        title={indexTitle}
        aria-label={`Unit ${String(unitIndex(unit) + 1)}：${indexTitle}`}
        aria-pressed={canToggleBubble ? isBubble : undefined}
        className={clsx(
          "w-8 shrink-0 flex items-center justify-center select-none touch-none",
          "font-mono text-xs font-bold tracking-tighter transition-colors duration-150",
          canReorder
            ? "cursor-grab hover:bg-stone-200/70 active:cursor-grabbing"
            : "cursor-pointer hover:bg-stone-200/70",
          isDragging
            ? "bg-stone-200/80 text-stone-700"
            : (isFocused
              ? "text-stone-500"
              : "text-stone-300 hover:text-stone-500"),
        )}
      >
        {unitIndex(unit) + 1}
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-2 py-2">
        <UnitContributorTooltip contributors={contributors}>
          {children}
        </UnitContributorTooltip>
      </div>
    </div>
  );
}
