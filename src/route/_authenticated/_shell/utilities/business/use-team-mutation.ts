import { useEffect, useRef } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { Result } from "@/shared/utility/result";

export type TeamMutation = <T>(
  label: string,
  request: (isCurrent: () => boolean) => Promise<Result<T>>,
  onSuccess: (data: T) => void,
) => Promise<boolean>;

export function useTeamMutation(canEdit: boolean): TeamMutation {
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const allowedRef = useRef(canEdit);
  const isCurrent = (): boolean => activeRef.current && allowedRef.current;
  const showToast = useToastStore((state) => state.showToast);
  useEffect(() => {
    allowedRef.current = canEdit;
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, [canEdit]);

  return async (label, request, onSuccess) => {
    if (!canEdit || busyRef.current || !isCurrent()) return false;
    busyRef.current = true;
    try {
      const result = await request(isCurrent);
      if (!isCurrent()) return false;
      if (!result.success) {
        console.error(`[TeamTerminology] ${label}失败`, result);
        showLocalApiFailure(result, showToast);
        return false;
      }
      onSuccess(result.data);
      showToast(`${label}成功`, "success");
      return true;
    } catch (error) {
      if (isCurrent()) {
        console.error(`[TeamTerminology] ${label}失败`, error);
        showLocalCaughtError(error, showToast, `${label}失败`);
      }
      return false;
    } finally {
      busyRef.current = false;
    }
  };
}
