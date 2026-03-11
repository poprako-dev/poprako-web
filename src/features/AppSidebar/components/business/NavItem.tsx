import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Props = {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export default function NavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group/item relative flex h-11 w-full",
        "items-center outline-none transition-all",
        isActive ? "text-green-500" : "text-[#7a8c80] hover:text-[#2e3c33]",
      )}
    >
      <div
        className={clsx(
          "absolute inset-y-0 left-2 right-2",
          "rounded-lg transition-colors",
          isActive ? "bg-green-50" : "group-hover/item:bg-[#f0f4f1]",
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
          className="transition-transform
            group-hover/item:scale-110"
        />
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
