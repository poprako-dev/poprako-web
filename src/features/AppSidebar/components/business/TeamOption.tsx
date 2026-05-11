import { Globe2, Check } from "lucide-react";
import clsx from "clsx";
import type { TeamConfig } from "../../types/types";

type Props = {
  teams: TeamConfig[];
  activeTeam: TeamConfig;
  isListOpen: boolean;
  onToggleList: () => void;
  onSelectTeam: (team: TeamConfig) => void;
};

function TeamList({
  teams,
  activeId,
  onSelect,
}: {
  teams: TeamConfig[];
  activeId: string;
  onSelect: (team: TeamConfig) => void;
}) {
  return (
    <div
      className={clsx(
        "absolute left-full top-0 pl-2 z-100",
        "animate-in fade-in slide-in-from-left-2",
        "duration-200",
      )}
    >
      <div
        className={clsx(
          "w-64 bg-[#F8F5F0] py-3",
          "border border-gray-100 rounded-sm",
          "shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
        )}
      >
        <div className="px-5 py-2 mb-2">
          <h4
            className={clsx(
              "text-[11px] font-black uppercase",
              "tracking-widest text-left",
              "text-gray-400",
            )}
          >
            切换汉化组
          </h4>
        </div>

        <div className="space-y-1 px-2">
          {teams.map((t) => {
            const isSelected = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className={clsx(
                  "w-full flex items-center gap-4",
                  "px-4 py-3 rounded-sm transition-all",
                  isSelected ? "bg-green-50" : "text-gray-500 hover:bg-gray-50",
                  isSelected ? "text-green-800" : "hover:text-gray-900",
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
                <div className={clsx("flex flex-col items-start min-w-0", "text-left")}>
                  <span className="text-sm font-bold truncate w-full">{t.name}</span>
                  <span className="text-[10px] opacity-60 truncate w-full">{t.desc}</span>
                </div>
                {isSelected && (
                  <Check
                    size={16}
                    className={clsx("ml-auto", "text-green-500")}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TeamOption({
  teams,
  activeTeam,
  isListOpen,
  onToggleList,
  onSelectTeam,
}: Props) {
  return (
    <div className="relative w-full h-16 group/trans">
      <button
        onClick={onToggleList}
        className="w-full h-full flex items-center outline-none"
      >
        <div
          className={clsx(
            "relative z-10 w-14 shrink-0 h-full",
            "flex items-center justify-center",
          )}
        >
          <div
            className={clsx(
              "flex items-center justify-center",
              "w-11 h-11 rounded-xl",
              "transition-all duration-300",
              isListOpen
                ? "bg-green-500 shadow-md"
                : "bg-[#2e5c33] group-hover/trans:bg-[#3a7340]",
              isListOpen && "scale-105",
            )}
          >
            <Globe2
              size={22}
              className={clsx(
                "text-white transition-transform",
                "duration-500",
                isListOpen && "rotate-12",
              )}
            />
          </div>
        </div>

        <div
          className={clsx(
            "absolute left-14 right-2 h-full",
            "flex flex-col justify-center",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-100 delay-0",
            "group-hover:duration-300",
            "group-hover:delay-150",
          )}
        >
          <div
            className={clsx(
              "px-2 py-2 rounded-xl h-11",
              "flex flex-col justify-center",
              "transition-colors duration-300",
              isListOpen ? "bg-green-50" : "hover:bg-gray-50",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  "text-sm font-bold tracking-wide",
                  "truncate text-[#2e3c33]",
                )}
              >
                {activeTeam.name}
              </span>
            </div>
          </div>
        </div>
      </button>

      {isListOpen && (
        <TeamList
          teams={teams}
          activeId={activeTeam.id}
          onSelect={onSelectTeam}
        />
      )}
    </div>
  );
}
