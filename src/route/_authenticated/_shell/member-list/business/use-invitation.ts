import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from "react";
import type { InvitationInfo } from "@/route/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

type Args = {
  onLoadInvitations: (offset: number, limit: number) => Promise<Result<InvitationInfo[]>>;
  onDeleteInvitation: ((invitationId: string) => Promise<Result<void>>) | undefined;
};

export function useInvitation({ onLoadInvitations, onDeleteInvitation }: Args): {
  pendingInvitations: InvitationInfo[];
  pendingDeleteId: string | null;
  setPendingDeleteId: Dispatch<SetStateAction<string | null>>;
  refreshInvitations: () => Promise<void>;
  deleteInvitation: (invitationId: string) => Promise<void>;
} {
  const { showToast } = useToastStore();
  const [pendingInvitations, setPendingInvitations] = useState<InvitationInfo[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const refreshInvitations = useCallback(async (): Promise<void> => {
    const result = await onLoadInvitations(0, 100);
    if (!result.success) {
      showLocalApiFailure(result, showToast);
      return;
    }
    setPendingInvitations(result.data);
  }, [onLoadInvitations, showToast]);

  useEffect(() => {
    let isCurrent = true;
    async function loadInvitations(): Promise<void> {
      const result = await onLoadInvitations(0, 100);
      if (!isCurrent) return;
      if (!result.success) {
        showLocalApiFailure(result, showToast);
        return;
      }
      setPendingInvitations(result.data);
    }
    void loadInvitations();
    return () => {
      isCurrent = false;
    };
  }, [onLoadInvitations, showToast]);

  const deleteInvitation = useCallback(
    async (invitationId: string): Promise<void> => {
      if (!onDeleteInvitation) return;
      const result = await onDeleteInvitation(invitationId);
      if (!result.success) {
        showLocalApiFailure(result, showToast);
        return;
      }
      setPendingInvitations((previous) => previous.filter((item) => item.id !== invitationId));
    },
    [onDeleteInvitation, showToast],
  );

  return {
    pendingInvitations,
    pendingDeleteId,
    setPendingDeleteId,
    refreshInvitations,
    deleteInvitation,
  };
}
