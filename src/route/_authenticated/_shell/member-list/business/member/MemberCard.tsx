import type { JSX } from "react";
import clsx from "clsx";
import { Clock, ShieldCheck, User as UserIcon } from "lucide-react";
import type { MemberInfo } from "@/route/business/identity/member";
import { hasRole, type Role } from "@/route/business/identity/role";
import { getMemberActivityColor } from "@/route/_authenticated/_shell/member-list/business/member/activity-status";

type Props = {
  member: MemberInfo;
  onClick?: (() => void) | undefined;
};

const ROLE_MAP: { label: string; role: Role }[] = [
  { label: "图", role: "rawProvider" },
  { label: "翻", role: "translator" },
  { label: "校", role: "proofreader" },
  { label: "嵌", role: "typesetter" },
  { label: "美", role: "redrawer" },
  { label: "监", role: "reviewer" },
  { label: "传", role: "publisher" },
];

function formatDate(ts?: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getFullYear())}/${String(d.getMonth() + 1)}/${String(d.getDate())}`;
}

type RoleTagProps = {
  label: string;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
};

function RoleTag({ label, isActive, isFirst, isLast }: RoleTagProps): JSX.Element {
  return (
    <div
      className={clsx(
        "flex flex-1 items-center justify-center py-0.5",
        "text-[11px] font-semibold transition-all duration-150",
        isFirst && "rounded-l-[2px]",
        isLast && "rounded-r-[2px]",
        isActive ? "bg-role-active text-ink-stone-500" : "text-ink-stone-200",
      )}
    >
      {label}
    </div>
  );
}

export function MemberCard({ member, onClick }: Props): JSX.Element {
  const { user } = member;
  const isAdmin = Boolean(user?.isSuperAdmin) || hasRole(member, "admin");

  return (
    <div // eslint-disable-line jsx-a11y/no-static-element-interactions
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onClick();
            }
          : undefined
      }
      className={clsx(
        "group flex w-full",
        "bg-surface-stone-50/10 border border-line-stone-200",
        "transition-all duration-200",
        "p-3 gap-4 rounded-lg shadow-xs",
        "hover:-translate-y-0.5 hover:shadow-sm",
        onClick && "cursor-pointer",
      )}
    >
      {/* 左侧：头像 */}
      <div className="relative shrink-0">
        <div
          className={clsx(
            "w-16 h-16 rounded-full bg-surface-stone-100 overflow-hidden",
            "border border-line-stone-200",
          )}
        >
          {(user?.avatarThumbnailUrl ?? user?.avatarUrl) ? (
            <img
              src={user.avatarThumbnailUrl ?? user.avatarUrl}
              alt={user.name}
              className={clsx(
                "w-full h-full object-cover",
                "grayscale-[0.3] group-hover:grayscale-0 transition-all",
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-stone-300">
              <UserIcon size={24} />
            </div>
          )}
        </div>
        {isAdmin && (
          <div
            className={clsx(
              "absolute -bottom-1 -right-1",
              "bg-surface-white rounded-full p-0.5 shadow-sm border border-line-stone-100",
            )}
          >
            <ShieldCheck size={14} className="text-ink-amber-500 fill-fill-amber-50" />
          </div>
        )}
      </div>

      {/* 右侧：信息区域 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* 昵称 + 状态指示线 */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink-stone-700 truncate leading-none pt-0.5">
            {user?.name ?? "未知成员"}
          </h3>
          <div
            className={clsx(
              "h-3 w-1 rounded-full shrink-0 transition-colors duration-300",
              getMemberActivityColor(user?.lastActiveAt),
            )}
          />
        </div>

        {/* QQ + 最后登录 */}
        <div className="flex items-center gap-2 text-[11px] text-ink-stone-400/80 font-mono py-2">
          <div className="flex items-center gap-1 shrink-0">
            <UserIcon size={12} strokeWidth={3.5} />
            <span className="tracking-tight ">{user?.qq ?? "—"}</span>
          </div>
          <span className="text-ink-stone-200">|</span>
          <div className="flex items-center gap-1 truncate">
            <Clock size={12} strokeWidth={3.5} />
            <span className="truncate tracking-tighter">{formatDate(user?.lastActiveAt)}</span>
          </div>
        </div>

        {/* 职能 Tags — 内陷式槽 */}
        <div className="flex rounded-[3px] bg-surface-stone-100 p-0.5 shadow-inner">
          {ROLE_MAP.map(({ label, role }, i) => (
            <RoleTag
              key={label}
              label={label}
              isActive={hasRole(member, role)}
              isFirst={i === 0}
              isLast={i === ROLE_MAP.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
