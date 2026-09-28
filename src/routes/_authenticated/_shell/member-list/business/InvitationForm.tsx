import { type JSX, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Circle, Copy, KeyRound, Loader2, MessageCircle } from "lucide-react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/routes/business/request";
import { ROLE_CONFIG } from "@/routes/_authenticated/_shell/member-list/business/invitation/role-option";
import type { CreateInvitationArgs } from "@/routes/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";

type Props = {
  teamId: string;
  onClose: () => void;
  onCreateInvitation: (args: CreateInvitationArgs) => Promise<Result<string>>;
  onInviteCreated: () => Promise<void>;
};

async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function InvitationForm({
  teamId,
  onClose,
  onCreateInvitation,
  onInviteCreated,
}: Props): JSX.Element {
  const { showToast } = useToastStore();
  const [qq, setQq] = useState("");
  const [selectedBits, setSelectedBits] = useState<number[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roleMask = selectedBits.reduce((mask, bit) => mask | bit, 0);
  const isFormValid = qq.trim().length > 4 && selectedBits.length > 0;

  function copyCode(code: string): void {
    void copyToClipboard(code)
      .then(() => {
        showToast("已复制邀请码", "success");
      })
      .catch((error: unknown) => {
        console.error("复制邀请码失败", error);
        showToast("复制失败，请手动选择邀请码复制", "error");
      });
  }

  function toggleRole(value: number): void {
    setSelectedBits((previous) =>
      previous.includes(value) ? previous.filter((bit) => bit !== value) : [...previous, value],
    );
  }

  async function submitInvitation(): Promise<void> {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onCreateInvitation({
        teamId,
        inviteeQq: qq.trim(),
        roles: roleMask,
      });
      if (!result.success) {
        showLocalApiFailure(result, showToast);
        return;
      }
      setGeneratedCode(result.data);
      await onInviteCreated();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 border-b border-border px-7 py-6 md:border-b-0 md:border-r">
      <h3 className="mb-5 text-base font-bold text-foreground">邀请新成员</h3>
      <div className="space-y-3">
        <div
          className={clsx(
            "flex items-center gap-2 rounded-md bg-surface-panel px-3 py-2",
            "border border-border shadow-sm shadow-border/50",
            "hover:border-border focus-within:border-border transition-all",
          )}
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={qq}
            onChange={(event) => {
              setQq(event.target.value.replaceAll(/\D/g, ""));
            }}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="QQ 号"
          />
        </div>

        <div className="grid grid-cols-4 gap-1">
          {ROLE_CONFIG.map((role) => {
            const isActive = selectedBits.includes(role.value);
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  toggleRole(role.value);
                }}
                className={clsx(
                  "flex items-center justify-center gap-1 rounded-md border",
                  "py-2 text-[12px] font-bold transition-all active:scale-95",
                  isActive
                    ? role.activeClass
                    : "border-border bg-surface-panel text-muted-foreground hover:border-border hover:text-muted-foreground",
                )}
              >
                {isActive ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                ) : (
                  <Circle className="h-3 w-3 shrink-0 opacity-30" />
                )}
                <span className="truncate">{role.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className={clsx(
            "flex items-center justify-center rounded-md border px-3 py-2.5",
            "transition-all duration-300",
            generatedCode
              ? "border-border bg-surface-panel shadow-sm shadow-border/50 opacity-100"
              : "border-border bg-muted opacity-60",
          )}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="font-mono text-sm font-bold tracking-widest text-foreground">
              {generatedCode || "— — — — — —"}
            </span>
            {generatedCode && (
              <button
                type="button"
                onClick={() => {
                  copyCode(generatedCode);
                }}
                className="text-muted-foreground transition-colors hover:text-text-secondary"
                title="复制"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-all active:scale-[0.98]",
              "bg-muted text-muted-foreground hover:bg-surface-hover border border-border",
            )}
          >
            取消
          </button>
          <button
            type="button"
            disabled={!isFormValid || isSubmitting}
            onClick={() => {
              void submitInvitation();
            }}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1 rounded-lg py-2",
              "text-xs font-semibold transition-all active:scale-[0.98]",
              isFormValid && !isSubmitting
                ? "bg-muted text-text-secondary border border-border hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                : "bg-muted text-muted-foreground cursor-not-allowed border border-border",
            )}
          >
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "邀请"}
          </button>
        </div>
      </div>
    </div>
  );
}
