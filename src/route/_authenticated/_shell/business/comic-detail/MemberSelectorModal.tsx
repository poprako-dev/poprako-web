import { type JSX, useEffect, useState } from "react";
import clsx from "clsx";
import { Search, Loader2, Plus } from "lucide-react";
import { AppDialog } from "@/shared/component/AppDialog";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Result } from "@/shared/utility/result";
import { type Role, unmaskRoles } from "@/route/business/identity/role";

const ROLE_LABEL: Record<string, string> = {
  rawProvider: "图",
  translator: "翻",
  proofreader: "校",
  typesetter: "嵌",
  redrawer: "美",
  reviewer: "监",
  publisher: "传",
  admin: "管",
};

type Props = {
  title: string;
  chapterId: string;
  role: Role;
  onLoadMembers: (
    chapterId: string,
    args: {
      role: Role;
      keyword?: string | undefined;
      offset: number;
      limit: number;
    },
  ) => Promise<Result<MemberInfo[]>>;
  setIsLoading: (isLoading: boolean) => void;
  isSubmitting?: boolean;
  onSelectUser: (userId: string) => void;
  onClose: () => void;
};

export function MemberSelectorModal({
  title,
  chapterId,
  role,
  onLoadMembers,
  setIsLoading,
  isSubmitting = false,
  onSelectUser,
  onClose,
}: Props): JSX.Element {
  const [keyword, setKeyword] = useState("");
  const showToast = useToastStore((state) => state.showToast);
  const queryKey = JSON.stringify([chapterId, role, keyword.trim()]);
  const [loaded, setLoaded] = useState<{
    queryKey: string;
    result: Result<MemberInfo[]>;
  } | null>(null);
  const result = loaded?.queryKey === queryKey ? loaded.result : null;
  const members = result?.success ? result.data : [];
  const loadError = result && !result.success ? result.error : null;
  const isFetching = !result;

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    const loadMembers = async (): Promise<void> => {
      try {
        const nextResult = await onLoadMembers(chapterId, {
          role,
          keyword: keyword.trim() || undefined,
          offset: 0,
          limit: 20,
        });
        if (isCancelled) {
          return;
        }
        setLoaded({ queryKey, result: nextResult });
        if (!nextResult.success) {
          console.error("[MemberSelectorModal] 加载成员失败:", nextResult.error);
          showLocalApiFailure(nextResult, showToast);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }
        console.error("[MemberSelectorModal] 加载成员异常:", error);
        setLoaded({ queryKey, result: { success: false, error: "加载成员失败，请重试" } });
        showLocalCaughtError(error, showToast, "加载成员失败");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    const timer = setTimeout(() => {
      void loadMembers();
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [chapterId, keyword, onLoadMembers, queryKey, role, setIsLoading, showToast]);

  return (
    <AppDialog title={title} size="large" onClose={onClose} bodyClassName="p-0">
      <div className="border-b border-line-slate-100 px-4 py-3">
        <div
          className={clsx(
            "flex items-center gap-2 rounded-md border px-3 py-2",
            "border-line-slate-200 bg-surface-white shadow-sm shadow-shadow-slate-100",
            "focus-within:border-line-slate-300",
          )}
        >
          <Search size={14} className="text-icon-muted-cool" />
          <input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
            }}
            placeholder="搜索昵称 / QQ"
            className={clsx(
              "w-full bg-transparent text-sm text-ink-slate-700 outline-none",
              "placeholder:text-text-muted-cool",
            )}
          />
        </div>
      </div>

      <div className="max-h-[55dvh] overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                onSelectUser(member.userId);
              }}
              disabled={isSubmitting}
              className={clsx(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-left",
                "border-line-slate-200",
                "transition-all hover:border-line-green-100 hover:bg-surface-green-50/40",
                isSubmitting && "cursor-wait opacity-60",
              )}
            >
              <div
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center",
                  "overflow-hidden rounded-full bg-surface-slate-100",
                  "text-xs font-bold text-text-muted-cool",
                )}
              >
                {member.user?.avatarThumbnailUrl ? (
                  <img
                    src={member.user.avatarThumbnailUrl}
                    alt={member.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (member.user?.name ?? member.userId).slice(0, 1)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-slate-700">
                  {member.user?.name ?? member.userId}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {unmaskRoles(member.roles)
                    .filter((r) => r !== "admin")
                    .map((r) => (
                      <span
                        key={r}
                        className={clsx(
                          "inline-block rounded px-1 py-px",
                          "text-[10px] font-bold leading-tight",
                          "bg-surface-slate-100 text-text-muted-cool",
                        )}
                      >
                        {ROLE_LABEL[r] ?? r}
                      </span>
                    ))}
                  {unmaskRoles(member.roles).filter((r) => r !== "admin").length === 0 && (
                    <span className="text-xs text-text-muted-cool">
                      {member.user?.qq ?? member.userId}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={clsx(
                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                  "border border-line-green-100 bg-surface-green-50 text-ink-green-500",
                )}
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </div>
            </button>
          ))}

          {isFetching && (
            <div className="flex h-24 items-center justify-center text-sm text-text-muted-cool">
              <Loader2 size={16} className="animate-spin" />
            </div>
          )}

          {loadError && (
            <p role="alert" className="py-6 text-center text-sm text-muted-foreground">
              {loadError}
            </p>
          )}

          {!isFetching && !loadError && members.length === 0 && (
            <div className="flex h-24 items-center justify-center text-sm text-text-muted-cool">
              没有可添加的成员
            </div>
          )}
        </div>
      </div>
    </AppDialog>
  );
}
