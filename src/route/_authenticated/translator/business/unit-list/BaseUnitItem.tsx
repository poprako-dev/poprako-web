import type { JSX } from "react/jsx-runtime";
import clsx from "clsx";
import { type PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";
import {
  unitId,
  unitIndex,
  type UnitInfo,
  unitIsBubble,
} from "@/route/_authenticated/translator/business/unit/unit";
import {
  type UnitContributor,
  UnitContributorTooltip,
} from "@/route/_authenticated/translator/business/unit-list/UnitContributorTooltip";

type Props = {
  unit: UnitInfo;
  isFocused: boolean;
  onIndexActivate?: ((unitId: string) => void) | undefined;
  canToggleBubble?: boolean | undefined;
  onIndexPointerDown?:
    | ((event: ReactPointerEvent<HTMLButtonElement>, unitId: string) => void)
    | undefined;
  isDragging?: boolean | undefined;
  isDragDimmed?: boolean | undefined;
  showDropIndicator?: boolean | undefined;
  enableReadOnly?: boolean | undefined;
  contributors: UnitContributor[];
  children: React.ReactNode;
  dataUnitId?: string | undefined;
};

export function BaseUnitItem({
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
}: Props): JSX.Element {
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
    indexTitle = canToggleBubble ? "轻触切换气泡状态，拖动序号调整顺序" : "拖动序号调整顺序";
  } else if (canToggleBubble) {
    indexTitle = "轻触切换气泡状态";
  }
  const activateIndex = (): void => {
    onIndexActivate?.(unitId(unit));
  };

  return (
    <div
      ref={containerRef}
      data-unit-id={dataUnitId}
      className={clsx(
        "relative flex cursor-text items-stretch border-y border-line-stone-200",
        "first:border-t-0 last:border-b-0 transition-all duration-75",
        isFocused ? "z-10 bg-surface-stone-300/50" : "bg-transparent hover:bg-surface-stone-100/70",
        isDragDimmed && "bg-surface-stone-100/60",
        isDragging && [
          "z-20 bg-surface-stone-50 opacity-100",
          "outline outline-1 outline-[var(--brand-leaf)] shadow-md",
        ],
      )}
    >
      {showDropIndicator && (
        <div
          className={clsx(
            "pointer-events-none absolute -top-0.5 right-0 left-0 z-30 h-1",
            "rounded-full bg-[var(--brand-leaf)] shadow-md",
          )}
        />
      )}
      <div
        className={clsx(
          "transition-all duration-150 shrink-0",
          "border-l-4",
          isBubble ? "border-line-pink-300" : "border-line-amber-300",
        )}
      />

      <button
        type="button"
        onPointerDown={
          canReorder
            ? (event) => {
                onIndexPointerDown(event, unitId(unit));
              }
            : undefined
        }
        onClick={
          canReorder
            ? (event) => {
                if (event.detail === 0) activateIndex();
              }
            : activateIndex
        }
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        title={indexTitle}
        aria-label={`Unit ${String(unitIndex(unit) + 1)}：${indexTitle}`}
        aria-pressed={canToggleBubble ? isBubble : undefined}
        className={clsx(
          "w-8 shrink-0 flex items-center justify-center select-none touch-none",
          "font-mono text-xs font-bold tracking-tighter transition-colors duration-150",
          canReorder
            ? "cursor-grab hover:bg-surface-stone-200/70 active:cursor-grabbing"
            : "cursor-pointer hover:bg-surface-stone-200/70",
          isDragging
            ? "bg-surface-stone-200/80 text-ink-stone-700"
            : isFocused
              ? "text-ink-stone-600"
              : "text-text-muted-warm hover:text-ink-stone-600",
        )}
      >
        {unitIndex(unit) + 1}
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-2 py-2">
        <UnitContributorTooltip contributors={contributors}>{children}</UnitContributorTooltip>
      </div>
    </div>
  );
}
