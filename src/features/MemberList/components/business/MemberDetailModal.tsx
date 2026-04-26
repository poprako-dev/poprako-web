import { useState } from "react";
import clsx from "clsx";
import {
  X,
  User as UserIcon,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import type { MemberInfo } from "@/types/member";
import type { Result } from "@/types/utils/result";

// ── Role config ──────────────────────────────────────────────────────────────

type RoleConfig = {
  label: string;
  value: number;
  activeClass: string;
};

const ROLE_CONFIG: RoleConfig[] = [
  {
    label: "图源",
    value: 1,
    activeClass: "bg-amber-50 text-amber-500 border-amber-200",
  },
  {
    label: "翻译",
    value: 2,
    activeClass: "bg-sky-50 text-sky-500 border-sky-200",
  },
  {
    label: "校对",
    value: 4,
    activeClass: "bg-emerald-50 text-emerald-500 border-emerald-200",
  },
  {
    label: "嵌字",
    value: 8,
    activeClass: "bg-violet-50 text-violet-500 border-violet-200",
  },
  {
    label: "美工",
    value: 16,
    activeClass: "bg-pink-50 text-pink-500 border-pink-200",
  },
  {
    label: "监修",
    value: 32,
    activeClass: "bg-indigo-50 text-indigo-400 border-indigo-200",
  },
  {
    label: "上传",
    value: 64,
    activeClass: "bg-rose-50 text-rose-400 border-rose-200",
  },
  {
    label: "管理",
    value: 128,
    activeClass: "bg-stone-100 text-stone-500 border-stone-200",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts?: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  member: MemberInfo;
  onClose: () => void;
  onUpdateRole: (id: string, roles: number) => Promise<Result<void>>;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function MemberDetailModal({
  member,
  onClose,
  onUpdateRole,
}: Props) {
  const { showToast } = useToastStore();
  const [selectedBits, setSelectedBits] = useState<number>(member.roles);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = member;
  const isAdmin = user?.isSuperAdmin || !!member.assignedAdminAt;
  const lastActive = formatDate(member.updatedAt || member.createdAt);
  const isDirty = selectedBits !== member.roles;

  const toggleBit = (value: number) =>
    setSelectedBits((prev) =>
      (prev & value) !== 0 ? prev & ~value : prev | value,
    );

  const handleConfirm = async () => {
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onUpdateRole(member.id, selectedBits);
      if (!result.success) {
        console.error("[MemberDetailModal] 更新角色失败:", result.error);
        showToast(result.error, "error");
        return;
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-white/60 backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "relative w-full max-w-sm overflow-hidden",
          "bg-white border border-slate-100 rounded-md",
          "shadow-[0_8px_40px_rgb(0,0,0,0.06)]",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        {/* ── Close ─────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={onClose}
          className={clsx(
            "absolute right-3 top-3 z-10 rounded-full p-1.5",
            "text-slate-300 transition-colors",
            "hover:bg-slate-50 hover:text-slate-500",
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          className={clsx(
            "flex items-center justify-between",
            "bg-gray-50/50 border-b border-slate-100",
            "px-5 py-4 pr-10",
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-slate-700 truncate">
              {user?.name ?? "未知成员"}
            </span>
            {user?.qq && (
              <span className="text-xs text-slate-400 font-mono shrink-0">
                ({user.qq})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <Clock className="h-3 w-3 text-slate-300" />
            <span className="text-[11px] text-slate-400 font-mono">
              {lastActive}
            </span>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5 px-6 py-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={clsx(
                "w-20 h-20 rounded-full bg-slate-100 overflow-hidden",
                "border border-slate-200",
              )}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={clsx(
                    "w-full h-full flex items-center",
                    "justify-center text-slate-300",
                  )}
                >
                  <UserIcon size={28} />
                </div>
              )}
            </div>
            {isAdmin && (
              <div
                className={clsx(
                  "absolute -bottom-1 -right-1",
                  "bg-white rounded-full p-0.5",
                  "shadow-sm border border-slate-100",
                )}
              >
                <ShieldCheck
                  size={16}
                  className="text-amber-500 fill-amber-50"
                />
              </div>
            )}
          </div>

          {/* Role grid: 2 rows × 4 cols */}
          <div className="flex-1 grid grid-cols-4 gap-1.5">
            {ROLE_CONFIG.map((role) => {
              const isActive = (selectedBits & role.value) !== 0;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggleBit(role.value)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-0.5",
                    "rounded-lg border py-2 text-[11px] font-bold",
                    "transition-all active:scale-95",
                    isActive
                      ? role.activeClass
                      : clsx(
                          "border-slate-100 bg-gray-50 text-slate-300",
                          "hover:bg-white hover:text-slate-400",
                          "hover:border-slate-200",
                        ),
                  )}
                >
                  {isActive ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 shrink-0 opacity-40" />
                  )}
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div
          className={clsx(
            "flex items-center justify-end gap-2",
            "border-t border-slate-100 px-5 py-3",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "rounded-lg px-4 py-1.5 text-xs font-bold",
              "bg-gray-50 text-slate-400 transition-all",
              "hover:bg-gray-100 active:scale-95",
            )}
          >
            收起
          </button>
          <button
            type="button"
            disabled={!isDirty || isSubmitting}
            onClick={handleConfirm}
            className={clsx(
              "flex items-center gap-1 rounded-lg px-4 py-1.5",
              "text-xs font-bold transition-all active:scale-95",
              isDirty && !isSubmitting
                ? clsx(
                    "bg-gray-50 text-slate-600 border border-transparent",
                    "hover:bg-emerald-50 hover:text-emerald-600",
                    "hover:border-emerald-100",
                  )
                : "bg-gray-50 text-slate-300 cursor-not-allowed",
            )}
          >
            {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
