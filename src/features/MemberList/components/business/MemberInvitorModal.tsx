import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import {
  X,
  MessageCircle,
  KeyRound,
  Copy,
  CheckCircle2,
  Circle,
  User,
  Loader2,
  Trash2,
} from "lucide-react";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { unmaskRoles } from "@/types/role";
import type { InvitationInfo, CreateInvitationArgs } from "@/types/invitation";
import type { Result } from "@/types/utils/result";

// ── Role config ──────────────────────────────────────────────────────────────
// Each entry carries the role bit value, the display label, and two Tailwind
// class strings: one for the checkbox toggle (active state) and one for the
// tag chip shown on pending invitation cards.

type RoleConfig = {
  roleKey: string;
  label: string;
  value: number;
  /** Applied to the toggle button when selected. */
  activeClass: string;
  /** Applied to the small label chip on pending invitation cards. */
  chipClass: string;
};

const ROLE_CONFIG: RoleConfig[] = [
  {
    roleKey: "rawProvider",
    label: "图源",
    value: 1,
    activeClass: "bg-amber-50 text-amber-500 border-amber-200",
    chipClass: "bg-amber-50 text-amber-500 border-amber-100",
  },
  {
    roleKey: "translator",
    label: "翻译",
    value: 2,
    activeClass: "bg-sky-50 text-sky-500 border-sky-200",
    chipClass: "bg-sky-50 text-sky-500 border-sky-100",
  },
  {
    roleKey: "proofreader",
    label: "校对",
    value: 4,
    activeClass: "bg-emerald-50 text-emerald-500 border-emerald-200",
    chipClass: "bg-emerald-50 text-emerald-500 border-emerald-100",
  },
  {
    roleKey: "typesetter",
    label: "嵌字",
    value: 8,
    activeClass: "bg-violet-50 text-violet-500 border-violet-200",
    chipClass: "bg-violet-50 text-violet-500 border-violet-100",
  },
  {
    roleKey: "redrawer",
    label: "美工",
    value: 16,
    activeClass: "bg-pink-50 text-pink-500 border-pink-200",
    chipClass: "bg-pink-50 text-pink-500 border-pink-100",
  },
  {
    roleKey: "reviewer",
    label: "监修",
    value: 32,
    activeClass: "bg-indigo-50 text-indigo-400 border-indigo-200",
    chipClass: "bg-indigo-50 text-indigo-400 border-indigo-100",
  },
  {
    roleKey: "publisher",
    label: "发布",
    value: 64,
    activeClass: "bg-rose-50 text-rose-400 border-rose-200",
    chipClass: "bg-rose-50 text-rose-400 border-rose-100",
  },
  {
    roleKey: "admin",
    label: "管理员",
    value: 128,
    activeClass: "bg-stone-100 text-stone-500 border-stone-200",
    chipClass: "bg-stone-100 text-stone-500 border-stone-200",
  },
];

const ROLE_CONFIG_BY_KEY = Object.fromEntries(
  ROLE_CONFIG.map((r) => [r.roleKey, r]),
);

function getRoleConfigs(roleMask: number): RoleConfig[] {
  return unmaskRoles(roleMask)
    .map((key) => ROLE_CONFIG_BY_KEY[key])
    .filter(Boolean) as RoleConfig[];
}

function copyToClipboard(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand("copy");
  } catch {
    // ignore
  }
  document.body.removeChild(el);
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  teamId: string;
  onClose: () => void;
  onLoadInvitations: (
    offset: number,
    limit: number,
  ) => Promise<Result<InvitationInfo[]>>;
  onCreateInvitation: (args: CreateInvitationArgs) => Promise<Result<string>>;
  onDeleteInvitation?: (invitationId: string) => Promise<Result<void>>;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function MemberInvitorModal({
  teamId,
  onClose,
  onLoadInvitations,
  onCreateInvitation,
  onDeleteInvitation,
}: Props) {
  const { showToast } = useToastStore();

  const [qq, setQq] = useState("");
  const [selectedBits, setSelectedBits] = useState<number[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<
    InvitationInfo[]
  >([]);

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadInvitations = useCallback(async () => {
    const result = await onLoadInvitations(0, 100);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }
    setPendingInvitations(result.data.filter((inv) => inv.pending));
  }, [onLoadInvitations, showToast]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleBit = (value: number) =>
    setSelectedBits((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const roleMaskFromSelected = selectedBits.reduce((acc, v) => acc | v, 0);
  const isFormValid = qq.trim().length > 4 && selectedBits.length > 0;

  const handleInvite = async () => {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onCreateInvitation({
        teamId,
        inviteeQq: qq.trim(),
        roles: roleMaskFromSelected,
      });
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      setGeneratedCode(result.data);
      await loadInvitations();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (invitationId: string) => {
      if (!onDeleteInvitation) return;
      const result = await onDeleteInvitation(invitationId);
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    },
    [onDeleteInvitation, showToast],
  );

  // ── Render ────────────────────────────────────────────────────────────────
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
          "relative flex w-full max-w-3xl flex-col overflow-hidden",
          "bg-white border border-slate-100 rounded-md",
          "shadow-[0_8px_40px_rgb(0,0,0,0.06)]",
          "animate-in zoom-in-95 duration-200",
          "md:flex-row",
        )}
      >
        {/* ── Close ─────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={onClose}
          className={clsx(
            "absolute right-3 top-3 z-10 rounded-full p-1.5",
            "text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500",
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Left: form ────────────────────────────────────────────────── */}
        <div className="flex-1 border-b border-slate-100 px-7 py-6 md:border-b-0 md:border-r">
          <h3 className="mb-5 text-base font-bold text-slate-700">邀请新成员</h3>

          <div className="space-y-3">
            {/* QQ input */}
            <div
              className={clsx(
                "flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2",
                "border border-slate-100 transition-all",
                "focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-200",
              )}
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                type="text"
                value={qq}
                onChange={(e) => setQq(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-300 outline-none"
                placeholder="QQ 号"
              />
            </div>

            {/* Role toggles */}
            <div className="grid grid-cols-4 gap-1.5">
              {ROLE_CONFIG.map((role) => {
                const isActive = selectedBits.includes(role.value);
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleBit(role.value)}
                    className={clsx(
                      "flex items-center justify-center gap-1 rounded-xl border py-2 text-[12px] font-bold transition-all active:scale-95",
                      isActive
                        ? role.activeClass
                        : "border-slate-100 bg-gray-50 text-slate-300 hover:bg-white hover:text-slate-400 hover:border-slate-200",
                    )}
                  >
                    {isActive ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 shrink-0 opacity-40" />
                    )}
                    <span className="truncate">{role.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Generated code */}
            <div
              className={clsx(
                "flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2.5",
                "transition-all duration-300",
                generatedCode
                  ? "border-slate-200 opacity-100"
                  : "border-slate-100 opacity-50",
              )}
            >
              <div className="flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-mono text-sm font-bold tracking-widest text-slate-600">
                  {generatedCode || "— — — — — —"}
                </span>
              </div>
              {generatedCode && (
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(generatedCode);
                    showToast("已复制邀请码", "success");
                  }}
                  className={clsx(
                    "rounded-lg border border-slate-100 bg-white p-1.5",
                    "text-slate-400 transition-colors hover:border-slate-200 hover:text-slate-600",
                  )}
                  title="复制"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  "flex-1 rounded-xl py-2 text-xs font-bold transition-all active:scale-95",
                  "bg-gray-50 text-slate-400 hover:bg-gray-100",
                )}
              >
                取消
              </button>
              <button
                type="button"
                disabled={!isFormValid || isSubmitting}
                onClick={handleInvite}
                className={clsx(
                  "flex-[2] flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all active:scale-95",
                  isFormValid && !isSubmitting
                    ? [
                        "bg-gray-50 text-slate-600",
                        "hover:bg-emerald-50 hover:text-emerald-600",
                        "border border-transparent hover:border-emerald-100",
                      ]
                    : "bg-gray-50 text-slate-300 cursor-not-allowed",
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "发送邀请"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: pending list ────────────────────────────────────────── */}
        <div className="flex-1 px-6 py-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            Pending
          </p>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
            {pendingInvitations.map((inv) => (
              <PendingInvitationCard
                key={inv.id}
                invitation={inv}
                onCopy={(code) => {
                  copyToClipboard(code);
                  showToast("已复制邀请码", "success");
                }}
                onDelete={onDeleteInvitation ? handleDelete : undefined}
              />
            ))}

            {pendingInvitations.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-300">
                暂无待处理的邀请
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pending card ─────────────────────────────────────────────────────────────

type PendingCardProps = {
  invitation: InvitationInfo;
  onCopy: (code: string) => void;
  onDelete?: (invitationId: string) => void;
};

function PendingInvitationCard({ invitation, onCopy, onDelete }: PendingCardProps) {
  const roleConfigs = getRoleConfigs(invitation.roles);

  return (
    <div
      className={clsx(
        "group/card relative rounded-md border border-slate-100 bg-white p-3",
        "shadow-[0_1px_4px_rgb(0,0,0,0.03)]",
        "transition-all hover:border-slate-200 hover:shadow-[0_2px_8px_rgb(0,0,0,0.05)]",
      )}
    >
      {/* QQ + code */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-slate-300" />
          <span className="font-mono text-sm font-bold text-slate-600">
            {invitation.inviteeQq}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-gray-50 px-2 py-1">
          <code className="font-mono text-[11px] font-bold tracking-tight text-slate-400">
            {invitation.invitationCode}
          </code>
          <button
            type="button"
            onClick={() => onCopy(invitation.invitationCode)}
            className="text-slate-300 transition-colors hover:text-slate-500"
            title="复制邀请码"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Role chips */}
      <div className="mt-2.5 flex flex-wrap gap-1 border-t border-slate-50 pt-2.5">
        {roleConfigs.map((rc) => (
          <span
            key={rc.roleKey}
            className={clsx(
              "rounded border px-1.5 py-0.5 text-[10px] font-bold",
              rc.chipClass,
            )}
          >
            {rc.label}
          </span>
        ))}
      </div>

      {/* Delete button — appears on hover at top-right */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(invitation.id)}
          className={clsx(
            "absolute right-2 top-2",
            "opacity-0 group-hover/card:opacity-100",
            "transition-opacity duration-150",
            "text-slate-300 hover:text-red-400",
          )}
          title="撤销邀请"
        >
          <Trash2 size={11} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
