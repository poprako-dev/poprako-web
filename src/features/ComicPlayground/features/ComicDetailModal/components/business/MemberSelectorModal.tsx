import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Search, X, Loader2, Plus } from "lucide-react";
import type { MemberInfo } from "@/types/member";
import {
  matchesAssignmentRole,
  type Role,
  unmaskRoles,
} from "@/types/role";

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
  role: Role;
  members: MemberInfo[];
  assignedUserIds: string[];
  isSubmitting?: boolean;
  onSelectUser: (userId: string) => void;
  onClose: () => void;
};

export default function MemberSelectorModal({
  title,
  role,
  members,
  assignedUserIds,
  isSubmitting,
  onSelectUser,
  onClose,
}: Props) {
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filteredMembers = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return members.filter((member) => {
      if (assignedUserIds.includes(member.userId)) return false;
      if (!matchesAssignmentRole(member, role)) return false;
      if (!normalized) return true;

      const name = member.user?.name?.toLowerCase() ?? "";
      const qq = member.user?.qq?.toLowerCase() ?? "";
      return name.includes(normalized) || qq.includes(normalized);
    });
  }, [assignedUserIds, keyword, members, role]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[90] flex items-center justify-center p-4",
        "bg-slate-950/30 backdrop-blur-sm",
      )}
    >
      <button
        type="button"
        aria-label="关闭成员选择器"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative z-10 flex max-h-[75vh] w-full max-w-xl flex-col",
          "overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-400">选择成员并立即加入当前分工</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "rounded-sm p-1 text-slate-400 transition-colors",
              "hover:bg-slate-100 hover:text-slate-700",
            )}
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <div
            className={clsx(
              "flex items-center gap-2 rounded-md border px-3 py-2",
              "border-slate-200 bg-slate-50",
            )}
          >
            <Search size={14} className="text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索昵称 / QQ"
              className={clsx(
                "w-full bg-transparent text-sm text-slate-700 outline-none",
                "placeholder:text-slate-300",
              )}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-2">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectUser(member.userId)}
                disabled={isSubmitting}
                className={clsx(
                  "flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-all",
                  "border-slate-200",
                  "hover:border-slate-300 hover:bg-slate-50",
                  isSubmitting && "cursor-wait opacity-60",
                )}
              >
                <div
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center",
                    "overflow-hidden rounded-full bg-slate-100",
                    "text-xs font-bold text-slate-500",
                  )}
                >
                  {member.user?.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user?.name ?? member.userId}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (member.user?.name ?? member.userId).slice(0, 1)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-700">
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
                            "bg-slate-100 text-slate-500",
                          )}
                        >
                          {ROLE_LABEL[r] ?? r}
                        </span>
                      ))}
                    {unmaskRoles(member.roles).filter((r) => r !== "admin")
                      .length === 0 && (
                      <span className="text-xs text-slate-300">
                        {member.user?.qq ?? member.userId}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center",
                    "rounded-sm border border-slate-200 bg-white text-slate-400",
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </div>
              </button>
            ))}

            {filteredMembers.length === 0 && (
              <div className="flex h-24 items-center justify-center text-sm text-slate-400">
                没有可添加的成员
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
