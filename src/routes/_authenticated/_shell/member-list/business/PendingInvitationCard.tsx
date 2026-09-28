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
        "rounded-md border border-border bg-surface-panel p-3",
        "shadow-sm transition-all hover:border-border hover:shadow-md",
      )}
    >
      {/* QQ + code */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm font-bold text-text-secondary">
            {invitation.inviteeQq}
          </span>
        </div>

        <div
          className={clsx(
            "flex items-center gap-0.5 rounded-md border border-border bg-muted",
            "px-2 py-1",
          )}
        >
          <code className="font-mono text-[11px] font-bold tracking-tight text-muted-foreground">
            {invitation.invitationCode}
          </code>
          <button
            type="button"
            onClick={() => {
              onCopy(invitation.invitationCode);
            }}
            className="text-muted-foreground transition-colors hover:text-muted-foreground"
            title="复制邀请码"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Role chips + delete */}
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-1">
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
            className="shrink-0 text-muted-foreground transition-colors hover:text-red-400"
            title="撤销邀请"
          >
            <Trash2 size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
