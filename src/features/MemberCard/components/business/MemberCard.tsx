import clsx from "clsx";
import { User as UserIcon, ShieldCheck, Clock } from "lucide-react";
import type { MemberInfo } from "@/types/member";

type Props = {
  member: MemberInfo;
  onClick?: () => void;
};

const ROLE_MAP: { label: string; field: keyof MemberInfo }[] = [
  { label: "图", field: "assignedRawProviderAt" },
  { label: "翻", field: "assignedTranslatorAt" },
  { label: "校", field: "assignedProofreaderAt" },
  { label: "嵌", field: "assignedTypesetterAt" },
  { label: "监", field: "assignedReviewerAt" },
  { label: "传", field: "assignedPublisherAt" },
];

function formatDate(ts?: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function getStatusColor(lastActiveAt?: number): string {
  if (!lastActiveAt) return "bg-stone-300";
  const daysAgo = (Date.now() - lastActiveAt) / (1000 * 60 * 60 * 24);
  if (daysAgo <= 7) return "bg-[#2e5c33]";
  if (daysAgo <= 30) return "bg-amber-200";
  return "bg-stone-300";
}

type RoleTagProps = {
  label: string;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
};

function RoleTag({ label, isActive, isFirst, isLast }: RoleTagProps) {
  return (
    <div
      className={clsx(
        "flex flex-1 items-center justify-center py-0.5",
        "text-[11px] font-semibold transition-all duration-150",
        isFirst && "rounded-l-[2px]",
        isLast && "rounded-r-[2px]",
        isActive
          ? "bg-[#edf3ea] text-stone-500"
          : "text-stone-200",
      )}
    >
      {label}
    </div>
  );
}

export default function MemberCard({ member, onClick }: Props) {
  const { user } = member;
  const isAdmin = user?.isSuperAdmin || !!member.assignedAdminAt;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group flex w-full",
        "bg-white border border-stone-200",
        "transition-all duration-200",
        "p-3 gap-4 rounded-lg shadow-xs",
        "hover:-translate-y-0.5 hover:shadow-md",
        onClick && "cursor-pointer",
      )}
    >
      {/* 左侧：头像 */}
      <div className="relative shrink-0">
        <div
          className={clsx(
            "w-16 h-16 rounded-full bg-stone-100 overflow-hidden",
            "border border-stone-200",
          )}
        >
          {user?.isAvatarUploaded && user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className={clsx(
                "w-full h-full object-cover",
                "grayscale-[0.3] group-hover:grayscale-0 transition-all",
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <UserIcon size={24} />
            </div>
          )}
        </div>
        {isAdmin && (
          <div
            className={clsx(
              "absolute -bottom-1 -right-1",
              "bg-white rounded-full p-0.5 shadow-sm border border-stone-100",
            )}
          >
            <ShieldCheck size={14} className="text-amber-500 fill-amber-50" />
          </div>
        )}
      </div>

      {/* 右侧：信息区域 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* 昵称 + 状态指示线 */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-700 truncate leading-none pt-0.5">
            {user?.name ?? "未知成员"}
          </h3>
          <div
            className={clsx(
              "h-3 w-1 rounded-full shrink-0 transition-colors duration-300",
              getStatusColor(user?.lastActiveAt),
            )}
          />
        </div>

        {/* QQ + 最后登录 */}
        <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono py-2">
          <div className="flex items-center gap-1 shrink-0">
            <UserIcon size={12} className="text-stone-400" />
            <span className="tracking-tight text-stone-500 font-semibold">
              {user?.qq ?? "—"}
            </span>
          </div>
          <span className="text-stone-200">|</span>
          <div className="flex items-center gap-1 truncate">
            <Clock size={12} className="text-stone-400 shrink-0" />
            <span className="text-stone-500 truncate tracking-tighter font-semibold">
              {formatDate(user?.lastActiveAt)}
            </span>
          </div>
        </div>

        {/* 职能 Tags — 内陷式槽 */}
        <div className="flex rounded-[3px] bg-stone-100 p-0.5 shadow-inner">
          {ROLE_MAP.map((role, i) => (
            <RoleTag
              key={role.label}
              label={role.label}
              isActive={!!member[role.field]}
              isFirst={i === 0}
              isLast={i === ROLE_MAP.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
