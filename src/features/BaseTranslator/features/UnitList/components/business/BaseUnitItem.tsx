import { useEffect, useRef } from "react";
import type { Unit } from "@/types/unit";

type Props = {
  unit: Unit;
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

  const leftBorderColor = unit.isBubble
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
      onMouseDown={() => onSelect?.(unit.id)}
      className={`relative cursor-text transition-all duration-75 flex items-stretch border-b border-gray-100 last:border-b-0 ${
        isFocused ? "bg-gray-100/60 z-10" : "bg-white hover:bg-gray-50"
      }`}
    >
      <div
        className={`transition-all duration-150 shrink-0 ${leftBorderColor} border-l-[3px] ${
          isFocused ? "border-l-4" : ""
        }`}
      />

      <div
        className={`w-8 flex items-center justify-center shrink-0 text-xs font-bold font-mono tracking-tighter ${
          isFocused ? "text-gray-500" : "text-gray-300"
        }`}
      >
        {(unit.index + 1).toString().padStart(2, "0")}
      </div>

      <div className="flex-1 flex flex-col justify-center px-2 py-2">
        {children}
      </div>

      <div className={`w-0.5 shrink-0 ${rightIndicatorColor}`} />
    </div>
  );
}
