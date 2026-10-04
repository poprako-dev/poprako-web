import type { JSX } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { AppDialog } from "@/shared/component/AppDialog";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";

type Props = {
  teams: TeamConfig[];
  activeTeamId: string;
  onSelect: (team: TeamConfig) => void;
  onClose: () => void;
};

export function TeamSwitchModal({ teams, activeTeamId, onSelect, onClose }: Props): JSX.Element {
  return (
    <AppDialog title="切换汉化组" size="compact" onClose={onClose} bodyClassName="px-2 pb-2 pt-1">
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {teams.map((team) => {
          const isSelected = team.id === activeTeamId;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                onSelect(team);
              }}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                "border transition-all duration-200",
                isSelected
                  ? "border-line-green-100 bg-surface-green-50 text-ink-green-800"
                  : [
                      "border-transparent text-text-muted-cool",
                      "hover:border-line-slate-100 hover:bg-surface-slate-50",
                    ],
              )}
            >
              <div
                className={clsx(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  "text-sm font-bold",
                  isSelected
                    ? "bg-brand-leaf text-heading-forest"
                    : "bg-surface-slate-100 text-text-muted-cool",
                )}
              >
                {team.short}
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                <span className="w-full truncate text-sm font-semibold">{team.name}</span>
                <span className="w-full truncate text-[10px] text-text-muted-cool">
                  {team.desc}
                </span>
              </div>
              {isSelected && <Check size={16} className="text-text-leaf" />}
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}
