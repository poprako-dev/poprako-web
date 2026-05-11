import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import clsx from "clsx";
import type { TeamConfig } from "@/features/AppSidebar/types/types";

type Props = {
  teams: TeamConfig[];
  activeTeamId: string;
  onSelect: (team: TeamConfig) => void;
  onClose: () => void;
};

export default function TeamSwitchModal({
  teams,
  activeTeamId,
  onSelect,
  onClose,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-black/15 backdrop-blur-[1px]",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(
          "w-72 bg-[#F8F5F0]",
          "border border-gray-100 rounded-sm",
          "shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
        )}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <h4
            className={clsx(
              "text-[11px] font-black uppercase",
              "tracking-widest",
              "text-gray-400",
            )}
          >
            切换汉化组
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-64 px-2 pb-2 space-y-1">
          {teams.map((t) => {
            const isSelected = t.id === activeTeamId;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className={clsx(
                  "w-full flex items-center gap-4",
                  "px-4 py-3 rounded-sm transition-all",
                  isSelected
                    ? "bg-green-50 text-green-800"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-lg flex shrink-0",
                    "items-center justify-center",
                    "font-black text-sm",
                    isSelected
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {t.short}
                </div>
                <div className="flex flex-col items-start min-w-0 text-left">
                  <span className="text-sm font-bold truncate w-full">
                    {t.name}
                  </span>
                  <span className="text-[10px] opacity-60 truncate w-full">
                    {t.desc}
                  </span>
                </div>
                {isSelected && (
                  <Check size={16} className="ml-auto text-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
