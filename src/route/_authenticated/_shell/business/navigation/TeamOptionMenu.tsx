import { Plus } from "lucide-react";
import { type KeyboardEvent, type ReactElement, useState } from "react";
import clsx from "clsx";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";
import { joinTeam } from "@/api/identity/identity-api";
import { useApiClient } from "@/route/business/api-context";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { isKeyboardComposing } from "@/shared/utility/keyboard";
import { TeamOptionItem } from "@/route/_authenticated/_shell/business/navigation/TeamOptionItem";
import { useTeamListInteractions } from "@/route/_authenticated/_shell/business/navigation/use-team-list-interactions";

async function joinTeamWithCode(
  client: ReturnType<typeof useApiClient>,
  inviteCode: string,
  isJoining: boolean,
  setInviteCode: (code: string) => void,
  setIsJoining: (isJoining: boolean) => void,
  onJoin: () => void,
  showToast: ReturnType<typeof useToastStore.getState>["showToast"],
): Promise<void> {
  const code = inviteCode.trim();
  if (!code || isJoining) {
    return;
  }
  setIsJoining(true);
  const result = await joinTeam(client, code);
  setIsJoining(false);
  if (result.success) {
    setInviteCode("");
    showToast("成功加入汉化组", "success");
    onJoin();
  } else {
    showLocalApiFailure(result, showToast);
  }
}

export function TeamList({
  teams,
  activeId,
  onSelect,
  onJoin,
  onLongPressTeam,
}: {
  teams: TeamConfig[];
  activeId: string;
  onSelect: (team: TeamConfig) => void;
  onJoin: () => void;
  onLongPressTeam?: ((team: TeamConfig) => void) | undefined;
}): ReactElement {
  const client = useApiClient();
  const showToast = useToastStore((state) => state.showToast);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const {
    handlePointerDown: handleTeamPointerDown,
    handlePointerUp: handleTeamPointerUp,
    handlePointerCancel: handleTeamPointerCancel,
    handleContextMenu: handleTeamContextMenu,
  } = useTeamListInteractions(onSelect, onLongPressTeam);

  const handleJoin = async (): Promise<void> => {
    await joinTeamWithCode(
      client,
      inviteCode,
      isJoining,
      setInviteCode,
      setIsJoining,
      onJoin,
      showToast,
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (isKeyboardComposing(e.nativeEvent)) {
      return;
    }
    if (e.key === "Enter") {
      void handleJoin();
    }
  };

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
          "w-64 bg-surface-white",
          "border border-line-gray-100 rounded-sm",
          "shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
          "flex flex-col",
        )}
      >
        <div className="px-5 pt-3 pb-2">
          <h4
            className={clsx(
              "text-[11px] font-black uppercase",
              "tracking-widest text-left",
              "text-text-muted-neutral",
            )}
          >
            切换汉化组
          </h4>
        </div>

        <div className="space-y-1 px-2 pb-2">
          {teams.map((team) => (
            <TeamOptionItem
              key={team.id}
              team={team}
              isSelected={team.id === activeId}
              onSelect={() => {
                onSelect(team);
              }}
              onPointerDown={onLongPressTeam ? handleTeamPointerDown(team) : undefined}
              onPointerUp={onLongPressTeam ? handleTeamPointerUp() : undefined}
              onPointerCancel={onLongPressTeam ? handleTeamPointerCancel() : undefined}
              onContextMenu={onLongPressTeam ? handleTeamContextMenu() : undefined}
            />
          ))}
        </div>

        <div
          className={clsx("border-t border-line-gray-100", "px-3 py-2", "flex items-center gap-2")}
        >
          <Plus size={14} className="text-icon-muted-neutral shrink-0" />
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入邀请码加入..."
            disabled={isJoining}
            className={clsx(
              "flex-1 min-w-0",
              "text-xs text-ink-gray-600",
              "bg-transparent outline-none",
              "placeholder:text-text-muted-neutral",
              isJoining && "opacity-50",
            )}
          />
        </div>
      </div>
    </div>
  );
}
