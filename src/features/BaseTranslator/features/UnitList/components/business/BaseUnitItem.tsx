import clsx from "clsx";
import { useEffect, useRef } from "react";
import { unitId, unitIndex, unitIsBubble, type UnitInfo, type UnitEdit } from "@/types/unit";

type Props = {
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: (unitId: string) => void;
  onModifyUnit?: (unitId: string, updates: UnitEdit) => void;
  isCompleted: boolean;
  children: React.ReactNode;
};

export default function BaseUnitItem({
  unit,
  isFocused,
  onSelect,
  onModifyUnit,
  isCompleted,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const pressTimer = useRef<number | null>(null);
  const longPressHandled = useRef(false);
  const currentPointerId = useRef<number | null>(null);

  const leftBorderColor = unitIsBubble(unit)
    ? "border-pink-300"
    : "border-amber-300";
  const rightIndicatorColor = isCompleted
    ? "bg-[var(--color-green-500)]"
    : "bg-transparent";

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

  function clearPress(pointerId?: number) {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    const id = pointerId ?? currentPointerId.current;
    if (id != null && containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(id);
      } catch (e) {}
    }
    currentPointerId.current = null;
  }

  function handlePointerDown(e: React.PointerEvent) {
    longPressHandled.current = false;
    currentPointerId.current = e.pointerId;
    try {
      containerRef.current?.setPointerCapture(e.pointerId);
    } catch (e) {}
    pressTimer.current = window.setTimeout(() => {
      longPressHandled.current = true;
      // toggle isBubble
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      onModifyUnit?.(unitId(unit), { isBubble: !unitIsBubble(unit) });
    }, 2000);
  }

  function handlePointerUp(e: React.PointerEvent) {
    const wasLong = longPressHandled.current;
    clearPress(e.pointerId);
    if (!wasLong) {
      onSelect?.(unitId(unit));
    }
  }

  function handlePointerCancel(e: React.PointerEvent) {
    clearPress(e.pointerId);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      className={clsx(
        "relative flex cursor-text items-stretch border-b border-gray-100",
        "last:border-b-0 transition-all duration-75",
        isFocused ? "z-10 bg-gray-100/60" : "bg-white hover:bg-gray-50",
      )}
    >
      <div
        className={`transition-all duration-150 shrink-0 ${leftBorderColor} border-l-[3px] ${
          isFocused ? "border-l-4" : ""
        }`}
      />

      <div
        className={`w-8 flex items-center justify-center shrink-0 text-xs font-bold font-mono
          tracking-tighter ${isFocused ? "text-gray-500" : "text-gray-300"}`}
      >
        {(unitIndex(unit) + 1).toString().padStart(2, "0")}
      </div>

      <div className="flex-1 flex flex-col justify-center px-2 py-2">
        {children}
      </div>

      <div className={`w-1 shrink-0 ${rightIndicatorColor}`} />
    </div>
  );
}
