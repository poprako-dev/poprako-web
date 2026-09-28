import { type JSX, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Circle, Clock, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/routes/business/request";
import type { MemberInfo } from "@/routes/business/identity/member";
import type { Result } from "@/shared/utility/result";

// ── Role config ──────────────────────────────────────────────────────────────

type RoleConfig = {
  label: string;
  value: number;
  activeClass: string;
};

const ROLE_CONFIG: RoleConfig[] = [
  {
    label: "图",
    value: 1,
    activeClass: "bg-amber-50 text-amber-500 border-amber-200",
  },
  {
    label: "翻",
    value: 2,
    activeClass: "bg-sky-50 text-sky-500 border-sky-200",
  },
  {
    label: "校",
    value: 4,
    activeClass: "bg-emerald-50 text-emerald-500 border-emerald-200",
  },
  {
    label: "嵌",
    value: 8,
    activeClass: "bg-violet-50 text-violet-500 border-violet-200",
  },
  {
    label: "美",
    value: 16,
    activeClass: "bg-pink-50 text-pink-500 border-pink-200",
  },
  {
    label: "监",
    value: 32,
    activeClass: "bg-indigo-50 text-indigo-400 border-indigo-200",
  },
  {
    label: "传",
    value: 64,
    activeClass: "bg-rose-50 text-rose-400 border-rose-200",
  },
  {
    label: "管",
    value: 128,
    activeClass: "bg-surface-hover text-muted-foreground border-border",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts?: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getFullYear())}/${String(d.getMonth() + 1)}/${String(d.getDate())}`;
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  member: MemberInfo;
  onClose: () => void;
  onUpdateRole: (id: string, roles: number) => Promise<Result<void>>;
};

// ── Component ────────────────────────────────────────────────────────────────

export function MemberDetailModal({ member, onClose, onUpdateRole }: Props): JSX.Element {
  const { showToast } = useToastStore();
  const [selectedBits, setSelectedBits] = useState<number>(member.roles);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = member;
  const isAdmin = user?.isSuperAdmin ?? Boolean(member.assignedAdminAt);
  const lastActive = formatDate(user?.lastActiveAt);
  const isDirty = selectedBits !== member.roles;

  const toggleBit = (value: number): void => {
    setSelectedBits((prev) => ((prev & value) === 0 ? prev | value : prev & ~value));
  };

  const handleConfirm = async (): Promise<void> => {
    if (!isDirty || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onUpdateRole(member.id, selectedBits);
      if (!result.success) {
        console.error("[MemberDetailModal] 更新角色失败:", result.error);
        showLocalApiFailure(result, showToast);
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
        "bg-overlay backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "relative w-full max-w-sm overflow-hidden",
          "bg-surface-panel border border-border rounded-xl",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        {/* ── Top accent bar ────────────────────────────────────────────── */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-20 z-1"
          style={{ background: "var(--color-green-500)" }}
        />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          className={clsx(
            "flex items-center justify-between",
            "bg-muted border-b border-border",
            "px-6 py-2 pr-10",
          )}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-md font-bold text-foreground truncate">
              {user?.name ?? "未知成员"}
            </span>
            {user?.qq && (
              <span className="text-xs font-semibold text-muted-foreground font-mono leading-none mt-0.5">
                {user.qq}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-mono">{lastActive}</span>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5 px-6 py-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={clsx(
                "w-16 h-16 rounded-full bg-surface-hover overflow-hidden",
                "border border-border",
              )}
            >
              {(user?.avatarThumbnailUrl ?? user?.avatarUrl) ? (
                <img
                  src={user.avatarThumbnailUrl ?? user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={clsx(
                    "w-full h-full flex items-center",
                    "justify-center text-muted-foreground",
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
                  "bg-surface-panel rounded-full p-0.5",
                  "shadow-sm border border-border",
                )}
              >
                <ShieldCheck size={16} className="text-amber-500 fill-amber-50" />
              </div>
            )}
          </div>

          {/* Role grid: 2 rows × 4 cols */}
          <div className="flex-1 grid grid-cols-4 gap-1">
            {ROLE_CONFIG.map((role) => {
              const isActive = (selectedBits & role.value) !== 0;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    toggleBit(role.value);
                  }}
                  className={clsx(
                    "flex flex-row items-center justify-center gap-1.5",
                    "rounded-sm border px-2 py-1 text-[11px] font-bold",
                    "transition-all active:scale-95",
                    isActive
                      ? role.activeClass
                      : clsx(
                          "border-border bg-surface-panel text-muted-foreground",
                          "hover:border-border hover:text-muted-foreground",
                        ),
                  )}
                >
                  {isActive ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 shrink-0 opacity-30" />
                  )}
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className={clsx("grid grid-cols-2 gap-2", "px-5 py-2")}>
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "rounded-sm px-4 py-1.5 text-xs font-semibold w-full",
              "bg-muted text-muted-foreground border border-border",
              "transition-all hover:bg-surface-hover active:scale-[0.98]",
            )}
          >
            收起
          </button>
          <button
            type="button"
            disabled={!isDirty || isSubmitting}
            onClick={() => {
              void handleConfirm();
            }}
            className={clsx(
              "flex items-center justify-center gap-1 rounded-sm px-4 py-1.5 w-full",
              "text-xs font-semibold transition-all active:scale-[0.98]",
              isDirty && !isSubmitting
                ? [
                    "bg-muted text-text-secondary border border-border",
                    "hover:bg-emerald-50 hover:text-emerald-600",
                    "hover:border-emerald-100",
                  ]
                : "bg-muted text-muted-foreground cursor-not-allowed border border-border",
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
