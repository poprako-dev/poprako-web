import { useRef, useState } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { Result } from "@/shared/utility/result";

type WorksetSubmission = {
  isSubmitting: boolean;
  submit: (action: () => Promise<Result<void>>) => Promise<void>;
};

export function useWorksetSubmission(onClose: () => void): WorksetSubmission {
  const inFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const submit = async (action: () => Promise<Result<void>>): Promise<void> => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsSubmitting(true);
    try {
      const result = await action();
      if (result.success) onClose();
    } catch (error) {
      console.error("[WorksetModifierModal] 提交失败:", error);
      showLocalCaughtError(error, showToast, "操作失败，请重试");
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submit };
}
