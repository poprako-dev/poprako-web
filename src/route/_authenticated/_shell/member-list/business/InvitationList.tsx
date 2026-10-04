import type { JSX } from "react";
import type { InvitationInfo } from "@/route/_authenticated/_shell/member-list/business/invitation/invitation";
import { PendingInvitationCard } from "@/route/_authenticated/_shell/member-list/business/PendingInvitationCard";

type Props = {
  invitations: InvitationInfo[];
  canDelete: boolean;
  onCopy: (code: string) => void;
  onRequestDelete: (id: string) => void;
};

export function InvitationList({
  invitations,
  canDelete,
  onCopy,
  onRequestDelete,
}: Props): JSX.Element {
  return (
    <div className="flex-1 bg-surface-slate-50/60 px-6 py-6">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-text-muted-cool">
        Pending
      </p>
      <div className="max-h-105 space-y-2 overflow-y-auto pr-0.5">
        {invitations.map((invitation) => (
          <PendingInvitationCard
            key={invitation.id}
            invitation={invitation}
            onCopy={onCopy}
            onDelete={canDelete ? onRequestDelete : undefined}
          />
        ))}
        {invitations.length === 0 && (
          <p className="py-8 text-center text-xs text-text-muted-cool">暂无待处理的邀请</p>
        )}
      </div>
    </div>
  );
}
