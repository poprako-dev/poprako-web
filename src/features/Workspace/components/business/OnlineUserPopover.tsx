import clsx from "clsx";
import { ChevronDown, UserRound, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UserInfo } from "@/types/user";

type Props = {
  onlineCount: number;
  users: readonly UserInfo[];
};

function avatarChar(user: UserInfo): string {
  return user.name.slice(0, 1).toUpperCase();
}

export default function OnlineUserPopover({ onlineCount, users }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
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
        onClick={() => setIsOpen((open) => !open)}
        className={clsx(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5",
          "text-sm font-medium text-slate-500 transition-colors",
          "hover:bg-stone-100/80 hover:text-slate-700",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#2e5c33]" />
        <span>{onlineCount} 人在线</span>
        <ChevronDown
          size={14}
          className={clsx(
            "text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="在线组员"
          className={clsx(
            "absolute right-0 top-full z-40 mt-2 w-64",
            "rounded-lg border border-stone-200 bg-[#FEFDF9] p-3 shadow-lg",
          )}
        >
          <div className="mb-2 flex items-center gap-2 text-left">
            <UsersRound size={15} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">在线组员</p>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {users.map((user) => {
              const avatarUrl = user.avatarThumbnailUrl || user.avatarUrl;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5"
                >
                  <div
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden",
                      "rounded-full bg-stone-100 text-xs font-semibold text-stone-500",
                    )}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{avatarChar(user)}</span>
                    )}
                  </div>
                  <span className="min-w-0 truncate text-sm text-slate-600">
                    {user.name}
                  </span>
                </div>
              );
            })}

            {onlineCount > users.length && (
              <div className="flex items-center gap-2 px-1.5 py-2 text-xs text-slate-400">
                <UserRound size={14} />
                正在加载在线组员
              </div>
            )}

            {onlineCount === 0 && (
              <p className="px-1.5 py-2 text-xs text-slate-400">暂无在线组员</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
