import type { JSX } from "react";
import clsx from "clsx";
import { ChevronDown, UserRound, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UserInfo } from "@/route/business/identity/user";
import { isKeyboardComposing } from "@/shared/utility/keyboard";
import type { OnlineUserStatus } from "@/route/_authenticated/_shell/workspace/business/online/use-online-users";

type Props = {
  onlineCount: number;
  users: readonly UserInfo[];
  status: OnlineUserStatus;
};

function avatarChar(user: UserInfo): string {
  return user.name.slice(0, 1).toUpperCase();
}

export function OnlineUserPopover({ onlineCount, users, status }: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || isKeyboardComposing(event)) return;
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={popoverRef} className="relative mt-2 self-start sm:mt-0 sm:self-auto">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className={clsx(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5",
          "text-sm font-medium text-muted-foreground transition-colors",
          "hover:bg-surface-hover hover:text-foreground",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
        <span>{status === "error" ? "在线人数未知" : `${String(onlineCount)} 人在线`}</span>
        <ChevronDown
          size={14}
          className={clsx("text-muted-foreground transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="在线组员"
          className={clsx(
            "absolute left-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)]",
            "sm:left-auto sm:right-0",
            "rounded-lg border border-border bg-surface-panel p-3 shadow-lg",
          )}
        >
          <div className="mb-2 flex items-center gap-2 text-left">
            <UsersRound size={15} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-text-secondary">在线组员</p>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {users.map((user) => {
              const avatarUrl = user.avatarThumbnailUrl ?? user.avatarUrl;

              return (
                <div key={user.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
                  <div
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden",
                      "rounded-full bg-surface-hover text-xs font-semibold text-muted-foreground",
                    )}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{avatarChar(user)}</span>
                    )}
                  </div>
                  <span className="min-w-0 truncate text-sm text-text-secondary">{user.name}</span>
                </div>
              );
            })}

            {status === "loading" && (
              <div className="flex items-center gap-2 px-1.5 py-2 text-xs text-muted-foreground">
                <UserRound size={14} />
                正在加载在线组员
              </div>
            )}

            {status === "error" && (
              <p className="px-1.5 py-2 text-xs text-muted-foreground">暂时无法获取在线成员</p>
            )}

            {status === "ready" && onlineCount === 0 && (
              <p className="px-1.5 py-2 text-xs text-muted-foreground">暂无在线组员</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
