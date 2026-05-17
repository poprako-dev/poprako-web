import clsx from "clsx";
import { User as UserIcon, ShieldCheck, Clock } from "lucide-react";
import type { MemberInfo } from "@/types/member";

type Props = {
  member: MemberInfo;
  onClick?: () => void;
};

const ROLE_MAP = [
  {
    label: "图",
    field: "assignedRawProviderAt" as keyof MemberInfo,
    color: "bg-amber-50 text-amber-500 border-amber-100",
  },
  {
    label: "翻",
    field: "assignedTranslatorAt" as keyof MemberInfo,
    color: "bg-blue-50 text-blue-500 border-blue-100",
  },
  {
    label: "校",
    field: "assignedProofreaderAt" as keyof MemberInfo,
    color: "bg-emerald-50 text-emerald-500 border-emerald-100",
  },
  {
    label: "嵌",
    field: "assignedTypesetterAt" as keyof MemberInfo,
    color: "bg-violet-50 text-violet-400 border-violet-100",
  },
  {
    label: "监",
    field: "assignedReviewerAt" as keyof MemberInfo,
    color: "bg-indigo-50 text-indigo-400 border-indigo-100",
  },
  {
    label: "传",
    field: "assignedPublisherAt" as keyof MemberInfo,
    color: "bg-rose-50 text-rose-400 border-rose-100",
  },
];

function formatDate(ts?: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

type RoleTagProps = {
  label: string;
  isActive: boolean;
  colorClass: string;
};

function RoleTag({ label, isActive, colorClass }: RoleTagProps) {
  return (
    <div
      className={clsx(
        "flex flex-1 items-center justify-center py-1",
        "rounded-sm border text-[11px] font-bold transition-all",
        isActive
          ? colorClass
          : "bg-slate-50 text-slate-300 border-slate-100 opacity-60",
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
        "bg-white border border-slate-200",
        " transition-all duration-200",
        "p-3 gap-4 rounded-sm shadow-sm",
        "hover:-translate-y-0.5 hover:shadow-md",
        onClick && "cursor-pointer",
      )}
    >
      {/* 左侧：头像 */}
      <div className="relative shrink-0">
        <div
          className={clsx(
            "w-16 h-16 rounded-full bg-slate-100 overflow-hidden",
            "border border-slate-200",
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
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <UserIcon size={24} />
            </div>
          )}
        </div>
        {isAdmin && (
          <div
            className={clsx(
              "absolute -bottom-1 -right-1",
              "bg-white rounded-full p-0.5 shadow-sm border border-slate-100",
            )}
          >
            <ShieldCheck size={14} className="text-amber-500 fill-amber-50" />
          </div>
        )}
      </div>

      {/* 右侧：信息区域 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* 昵称 */}
        <h3 className="text-base font-bold text-slate-700 truncate leading-none pt-0.5">
          {user?.name ?? "未知成员"}
        </h3>

        {/* QQ + 最后登录 */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono py-2">
          <div className="flex items-center gap-1 shrink-0">
            <UserIcon size={12} className="text-slate-400" />
            <span className="tracking-tight text-slate-500 font-semibold">
              {user?.qq ?? "—"}
            </span>
          </div>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-1 truncate">
            <Clock size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-500 truncate tracking-tighter font-semibold">
              {formatDate(user?.lastActiveAt)}
            </span>
          </div>
        </div>

        {/* 职能 Tags */}
        <div className="flex gap-1.5">
          {ROLE_MAP.map((role) => (
            <RoleTag
              key={role.label}
              label={role.label}
              isActive={!!member[role.field]}
              colorClass={role.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
