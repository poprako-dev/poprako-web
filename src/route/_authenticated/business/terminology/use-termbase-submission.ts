import { useRef, useState } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

type Operation = "save" | "import" | "delete";

type TermbaseSubmission = {
  pending: Operation | undefined;
  submit: (operation: Operation, action: () => Promise<boolean>) => Promise<void>;
};

export function useTermbaseSubmission(onClose: () => void): TermbaseSubmission {
  const inFlightRef = useRef(false);
  const [pending, setPending] = useState<Operation>();
  const showToast = useToastStore((state) => state.showToast);

  const submit = async (operation: Operation, action: () => Promise<boolean>): Promise<void> => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setPending(operation);
    try {
      if (await action()) onClose();
    } catch (error) {
      console.error("[TermbaseEditorDialog] 提交失败", { operation, error });
      showLocalCaughtError(error, showToast, "操作失败，请重试");
    } finally {
      inFlightRef.current = false;
      setPending(undefined);
    }
  };

  return { pending, submit };
}
