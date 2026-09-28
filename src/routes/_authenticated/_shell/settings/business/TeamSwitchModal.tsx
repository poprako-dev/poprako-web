import type { JSX } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { AppDialog } from "@/shared/component/AppDialog";
import type { TeamConfig } from "@/routes/_authenticated/_shell/business/navigation/app-sidebar-type";

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
                  ? "border-green-100 bg-green-50 text-green-800"
                  : [
                      "border-transparent text-muted-foreground",
                      "hover:border-border hover:bg-muted",
                    ],
              )}
            >
              <div
                className={clsx(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  "text-sm font-bold",
                  isSelected
                    ? "bg-(--color-green-500) text-primary-foreground"
                    : "bg-surface-hover text-muted-foreground",
                )}
              >
                {team.short}
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                <span className="w-full truncate text-sm font-semibold">{team.name}</span>
                <span className="w-full truncate text-[10px] text-muted-foreground">
                  {team.desc}
                </span>
              </div>
              {isSelected && <Check size={16} className="text-green-500" />}
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}
