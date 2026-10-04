import type { JSX } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { InvitationForm } from "@/route/_authenticated/_shell/member-list/business/InvitationForm";
import { InvitationList } from "@/route/_authenticated/_shell/member-list/business/InvitationList";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";
import { useInvitation } from "@/route/_authenticated/_shell/member-list/business/use-invitation";

type Props = {
  teamId: string;
  onClose: () => void;
  onLoadInvitations: (offset: number, limit: number) => Promise<Result<InvitationInfo[]>>;
  onCreateInvitation: (args: CreateInvitationArgs) => Promise<Result<string>>;
  onDeleteInvitation: ((invitationId: string) => Promise<Result<void>>) | undefined;
};

export function MemberInvitorModal({
  teamId,
  onClose,
  onLoadInvitations,
  onCreateInvitation,
  onDeleteInvitation,
}: Props): JSX.Element {
  const { showToast } = useToastStore();
  const {
    pendingInvitations,
    pendingDeleteId,
    setPendingDeleteId,
    refreshInvitations,
    deleteInvitation,
  } = useInvitation({ onLoadInvitations, onDeleteInvitation });

  function copyInvitationCode(code: string): void {
    void navigator.clipboard
      .writeText(code)
      .then(() => {
        showToast("已复制邀请码", "success");
      })
      .catch((error: unknown) => {
        console.error("复制邀请码失败", error);
        showToast("复制失败，请手动选择邀请码复制", "error");
      });
  }

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-surface-white/60 backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "relative flex w-full max-w-3xl flex-col overflow-hidden",
          "bg-surface-white border border-line-slate-200 rounded-xl",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
          "md:flex-row",
        )}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-20 z-1"
          style={{ background: "var(--brand-leaf)" }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭邀请窗口"
          className={clsx(
            "absolute right-3 top-3 z-10 rounded-full p-1.5",
            "text-text-muted-cool transition-colors hover:bg-surface-slate-50 hover:text-text-muted-cool",
          )}
        >
          <X className="h-4 w-4" />
        </button>

        <InvitationForm
          teamId={teamId}
          onClose={onClose}
          onCreateInvitation={onCreateInvitation}
          onInviteCreated={refreshInvitations}
        />
        <InvitationList
          invitations={pendingInvitations}
          canDelete={onDeleteInvitation !== undefined}
          onCopy={copyInvitationCode}
          onRequestDelete={setPendingDeleteId}
        />
      </div>
      {pendingDeleteId && (
        <ConfirmDialog
          title="确认撤销邀请"
          description="撤销邀请后，该邀请码将立即失效。此操作不可撤销。"
          onConfirm={() => {
            void deleteInvitation(pendingDeleteId);
            setPendingDeleteId(null);
          }}
          onCancel={() => {
            setPendingDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
