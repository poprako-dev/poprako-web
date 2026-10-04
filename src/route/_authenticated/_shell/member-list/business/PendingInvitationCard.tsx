import type { JSX } from "react";
import clsx from "clsx";
import { Copy, Trash2, User } from "lucide-react";
import type { InvitationInfo } from "./invitation/invitation";
import { getRoleConfigs } from "./invitation/role-option";

type Props = {
  invitation: InvitationInfo;
  onCopy: (code: string) => void;
  onDelete?: ((invitationId: string) => void) | undefined;
};

export function PendingInvitationCard({ invitation, onCopy, onDelete }: Props): JSX.Element {
  const roleConfigs = getRoleConfigs(invitation.roles);

  return (
    <div
      className={clsx(
        "rounded-md border border-line-slate-200/80 bg-surface-white p-3",
        "shadow-[0_1px_3px_rgb(0,0,0,0.04)]",
        "transition-all hover:border-line-slate-200 hover:shadow-[0_2px_6px_rgb(0,0,0,0.06)]",
      )}
    >
      {/* QQ + code */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-icon-muted-cool" />
          <span className="font-mono text-sm font-bold text-ink-slate-600">
            {invitation.inviteeQq}
          </span>
        </div>

        <div
          className={clsx(
            "flex items-center gap-0.5 rounded-md border border-line-slate-200 bg-surface-slate-50",
            "px-2 py-1",
          )}
        >
          <code className="font-mono text-[11px] font-bold tracking-tight text-text-muted-cool">
            {invitation.invitationCode}
          </code>
          <button
            type="button"
            onClick={() => {
              onCopy(invitation.invitationCode);
            }}
            className="text-text-muted-cool transition-colors hover:text-text-muted-cool"
            title="复制邀请码"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Role chips + delete */}
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-line-slate-50 pt-1">
        <div className="flex flex-wrap gap-1">
          {roleConfigs.map((rc) => (
            <span
              key={rc.roleKey}
              className={clsx("rounded-xs border px-1 py-0.5 text-[10px] font-bold", rc.chipClass)}
            >
              {rc.label}
            </span>
          ))}
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              onDelete(invitation.id);
            }}
            className="shrink-0 text-text-muted-cool transition-colors hover:text-text-danger"
            title="撤销邀请"
          >
            <Trash2 size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
