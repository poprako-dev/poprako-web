import clsx from "clsx";
import { useEffect, useRef } from "react";
import {
  unitId,
  unitIndex,
  unitIsBubble,
  type UnitInfo,
  type UnitEdit,
} from "@/types/unit";

type Props = {
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: (unitId: string) => void;
  onModifyUnit?: (unitId: string, updates: UnitEdit) => void;
  children: React.ReactNode;
  dataUnitId?: string;
};

export default function BaseUnitItem({
  unit,
  isFocused,
  onSelect,
  onModifyUnit,
  children,
  dataUnitId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pressTimer = useRef<number | null>(null);
  const longPressHandled = useRef(false);
  const currentPointerId = useRef<number | null>(null);

  const isBubble = unitIsBubble(unit);

  useEffect(() => {
    if (isFocused && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
    };
  }, [isFocused]);

  function clearPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    currentPointerId.current = null;
  }

  function handleIndexPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    longPressHandled.current = false;
    currentPointerId.current = e.pointerId;
    pressTimer.current = window.setTimeout(() => {
      longPressHandled.current = true;
      onModifyUnit?.(unitId(unit), { isBubble: !unitIsBubble(unit) });
    }, 1000);
  }

  function handleIndexPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const wasLong = longPressHandled.current;
    clearPress();
    if (!wasLong) {
      onSelect?.(unitId(unit));
    }
  }

  function handleIndexPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    clearPress();
  }

  function handleIndexContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
  }

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
      )}
    >
      <div
        className={clsx(
          "transition-all duration-150 shrink-0",
          "border-l-4",
          isFocused && "border-l-[5px]",
          isBubble ? "border-pink-300" : "border-amber-300",
        )}
      />

      <div
        onPointerDown={handleIndexPointerDown}
        onPointerUp={handleIndexPointerUp}
        onPointerCancel={handleIndexPointerCancel}
        onPointerLeave={handleIndexPointerCancel}
        onContextMenu={handleIndexContextMenu}
        title="长按 2 秒切换框内/框外"
        className={clsx(
          "w-8 shrink-0 flex items-center justify-center select-none touch-none",
          "text-xs font-bold font-mono tracking-tighter transition-colors duration-150",
          "cursor-pointer hover:bg-stone-200/70",

          isFocused ? "text-stone-500" : "text-stone-300 hover:text-stone-500",
        )}
      >
        {(unitIndex(unit) + 1).toString().padStart(2, "0")}
      </div>

      <div className="flex-1 flex flex-col justify-center px-2 py-2">
        {children}
      </div>

    </div>
  );
}
