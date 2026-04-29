import clsx from "clsx";
import { useEffect, useRef } from "react";
import { unitId, unitIndex, unitIsBubble, type UnitInfo } from "@/types/unit";

type Props = {
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: (unitId: string) => void;
  isCompleted: boolean;
  children: React.ReactNode;
};

export default function BaseUnitItem({
  unit,
  isFocused,
  onSelect,
  isCompleted,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [isFocused]);

  return (
    <div
      ref={containerRef}
      onMouseDown={() => onSelect?.(unitId(unit))}
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
