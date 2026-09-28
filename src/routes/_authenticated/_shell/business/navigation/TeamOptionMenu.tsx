import { Check, Plus } from "lucide-react";
import { type KeyboardEvent, type ReactElement, useCallback, useRef, useState } from "react";
import clsx from "clsx";
import type { TeamConfig } from "@/routes/_authenticated/_shell/business/navigation/app-sidebar-type";
import { joinMember } from "@/routes/business/identity/member-request";
import { showLocalApiFailure } from "@/routes/business/request";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { isKeyboardComposing } from "@/shared/utility/keyboard";

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
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const showToast = useToastStore((s) => s.showToast);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTeamRef = useRef<TeamConfig | null>(null);
  const longPressHandledRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (!longPressTimerRef.current) {
      return;
    }

    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const handleTeamPointerDown = useCallback(
    (t: TeamConfig) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      longPressHandledRef.current = false;
      longPressTeamRef.current = t;
      longPressTimerRef.current = setTimeout(() => {
        longPressHandledRef.current = true;
        onLongPressTeam?.(t);
      }, 500);
    },
    [onLongPressTeam],
  );

  const handleTeamPointerUp = useCallback(
    () => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      clearLongPress();
      if (!longPressHandledRef.current) {
        const t = longPressTeamRef.current;
        if (t) {
          onSelect(t);
        }
      }
    },
    [clearLongPress, onSelect],
  );

  const handleTeamPointerCancel = useCallback(
    () => () => {
      clearLongPress();
    },
    [clearLongPress],
  );

  const handleTeamContextMenu = useCallback(
    () => (e: React.MouseEvent) => {
      e.preventDefault();
    },
    [],
  );

  const handleJoin = async (): Promise<void> => {
    const code = inviteCode.trim();
    if (!code || isJoining) {
      return;
    }
    setIsJoining(true);
    const result = await joinMember(code);
    setIsJoining(false);
    if (result.success) {
      setInviteCode("");
      showToast("成功加入汉化组", "success");
      onJoin();
    } else {
      showLocalApiFailure(result, showToast);
    }
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
          "w-64 bg-white",
          "border border-gray-100 rounded-sm",
          "shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
          "flex flex-col",
        )}
      >
        <div className="px-5 pt-3 pb-2">
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

        <div className="space-y-1 px-2 pb-2">
          {teams.map((t) => {
            const isSelected = t.id === activeId;
            const itemContent = (
              <>
                <div
                  className={clsx(
                    "w-10 h-10 rounded-lg flex shrink-0",
                    "items-center justify-center overflow-hidden",
                    "font-black text-sm relative",
                    isSelected
                      ? "bg-[var(--color-green-500)] text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {(t.avatarThumbnailUrl ?? t.avatarUrl) ? (
                    <img
                      src={t.avatarThumbnailUrl ?? t.avatarUrl}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    t.short
                  )}
                </div>
                <div className={clsx("flex flex-col items-start min-w-0", "text-left")}>
                  <span className="text-sm font-bold truncate w-full">{t.name}</span>
                  <span className="text-[10px] opacity-60 truncate w-full">{t.desc}</span>
                </div>
                {isSelected && <Check size={16} className={clsx("ml-auto", "text-green-500")} />}
              </>
            );

            const baseClasses = clsx(
              "w-full flex items-center gap-4",
              "px-4 py-3 rounded-sm transition-all",
              isSelected ? "bg-green-50" : "text-gray-500 hover:bg-gray-50",
              isSelected ? "text-green-800" : "hover:text-gray-900",
            );

            return onLongPressTeam ? (
              <div
                key={t.id}
                onPointerDown={handleTeamPointerDown(t)}
                role="button"
                tabIndex={0}
                onPointerUp={handleTeamPointerUp()}
                onPointerCancel={handleTeamPointerCancel()}
                onPointerLeave={handleTeamPointerCancel()}
                onContextMenu={handleTeamContextMenu()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onSelect(t);
                  }
                }}
                className={clsx(baseClasses, "select-none touch-none cursor-pointer")}
                title="长按修改汉化组信息"
              >
                {itemContent}
              </div>
            ) : (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  onSelect(t);
                }}
                className={baseClasses}
              >
                {itemContent}
              </button>
            );
          })}
        </div>

        <div className={clsx("border-t border-gray-100", "px-3 py-2", "flex items-center gap-2")}>
          <Plus size={14} className="text-gray-300 shrink-0" />
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
              "text-xs text-gray-600",
              "bg-transparent outline-none",
              "placeholder:text-gray-300",
              isJoining && "opacity-50",
            )}
          />
        </div>
      </div>
    </div>
  );
}
