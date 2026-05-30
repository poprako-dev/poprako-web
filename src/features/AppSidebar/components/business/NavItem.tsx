import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Props = {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  hasBadge?: boolean;
};

export default function NavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  hasBadge = false,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group/item relative flex h-11 w-full",
        "items-center outline-none transition-all",
        isActive ? "text-[#166534]" : "text-[#3D3028]",
      )}
    >
      {/* Left accent bar — expands from 0 height on hover, always visible when active */}
      <div
        className={clsx(
          "absolute left-2 top-1/2 -translate-y-1/2",
          "w-0.75 h-5 rounded-full",
          "transition-all duration-200 ease-out",
          isActive
            ? "bg-green-600 scale-y-100"
            : "bg-green-500/85 scale-y-0 group-hover/item:scale-y-100",
        )}
      />

      <span
        className={clsx(
          "relative z-10 flex w-14 shrink-0",
          "items-center justify-center",
        )}
      >
        <Icon
          size={20}
          className={clsx(
            "transition-all",
            "group-hover/item:scale-110",
            isActive && "scale-110",
          )}
        />
        {hasBadge && (
          <span
            className={clsx(
              "absolute top-0 right-2.5",
              "w-1.5 h-1.5 rounded-full bg-red-400",
            )}
          />
        )}
      </span>

      <span
        className={clsx(
          "absolute left-14 z-10",
          "text-sm font-medium tracking-wide",
          "opacity-0 -translate-x-1",
          "transition-all duration-100 delay-0",
          "group-hover:opacity-100",
          "group-hover:translate-x-0",
          "group-hover:duration-300 group-hover:delay-150",
        )}
      >
        {label}
      </span>
    </button>
  );
}
