import { Check } from "lucide-react";
import type { ReactElement } from "react";
import clsx from "clsx";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";

type Props = {
  team: TeamConfig;
  isSelected: boolean;
  onSelect: () => void;
  onPointerDown?: ((event: React.PointerEvent) => void) | undefined;
  onPointerUp?: ((event: React.PointerEvent) => void) | undefined;
  onPointerCancel?: (() => void) | undefined;
  onContextMenu?: ((event: React.MouseEvent) => void) | undefined;
};

export function TeamOptionItem({
  team,
  isSelected,
  onSelect,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onContextMenu,
}: Props): ReactElement {
  const itemContent = (
    <>
      <div
        className={clsx(
          "w-10 h-10 rounded-lg flex shrink-0",
          "items-center justify-center overflow-hidden",
          "font-black text-sm relative",
          isSelected
            ? "bg-brand-leaf text-ink-white"
            : "bg-surface-gray-100 text-text-muted-neutral",
        )}
      >
        {(team.avatarThumbnailUrl ?? team.avatarUrl) ? (
          <img
            src={team.avatarThumbnailUrl ?? team.avatarUrl}
            alt={team.name}
            className="w-full h-full object-cover"
          />
        ) : (
          team.short
        )}
      </div>
      <div className={clsx("flex flex-col items-start min-w-0", "text-left")}>
        <span className="text-sm font-bold truncate w-full">{team.name}</span>
        <span className="text-[10px] text-text-muted-neutral truncate w-full">{team.desc}</span>
      </div>
      {isSelected && <Check size={16} className={clsx("ml-auto", "text-ink-green-500")} />}
    </>
  );
  const baseClasses = clsx(
    "w-full flex items-center gap-4",
    "px-4 py-3 rounded-sm transition-all",
    isSelected ? "bg-surface-green-50" : "text-text-muted-neutral hover:bg-surface-gray-50",
    isSelected ? "text-ink-green-800" : "hover:text-ink-gray-900",
  );

  if (onPointerDown && onPointerUp && onPointerCancel && onContextMenu) {
    return (
      <div
        onPointerDown={onPointerDown}
        role="button"
        tabIndex={0}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
        onContextMenu={onContextMenu}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onSelect();
        }}
        className={clsx(baseClasses, "select-none touch-none cursor-pointer")}
        title="长按修改汉化组信息"
      >
        {itemContent}
      </div>
    );
  }
  return (
    <button type="button" onClick={onSelect} className={baseClasses}>
      {itemContent}
    </button>
  );
}
