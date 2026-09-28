import { type JSX, useState } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { IconInputRow } from "@/shared/component/IconInputRow";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { updateUserPassword } from "@/api/identity/identity-api";
import { showLocalApiFailure } from "@/route/business/request-error";

import { useApiClient } from "@/route/business/api-context";

type Props = {
  userId: string;
  onClose: () => void;
};

export function PasswordResetDialog({ userId, onClose }: Props): JSX.Element {
  const client = useApiClient();
  const { showToast } = useToastStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isComplete = Boolean(currentPassword && newPassword && confirmedPassword);
  const isMatching = newPassword === confirmedPassword;

  const handleConfirm = async (): Promise<void> => {
    if (!isComplete || !isMatching) return;

    setIsSubmitting(true);
    const result = await updateUserPassword(client, userId, {
      currentPassword,
      newPassword,
    });
    setIsSubmitting(false);

    if (!result.success) {
      console.error("Failed to reset password", result.error);
      showLocalApiFailure(result, showToast);
      return;
    }

    showToast("密码已重置", "success");
    onClose();
  };

  return (
    <ConfirmDialog
      title="重置密码"
      description="验证当前密码后设置一个新密码"
      confirmLabel="确认重置"
      onConfirm={() => {
        void handleConfirm();
      }}
      onCancel={onClose}
      loading={isSubmitting}
      confirmDisabled={!isComplete || !isMatching}
    >
      <div className="space-y-2.5 px-5 pt-2">
        <IconInputRow
          icon={<LockKeyhole size={14} />}
          placeholder="当前密码"
          value={currentPassword}
          onChange={setCurrentPassword}
          mode="password"
        />
        <IconInputRow
          icon={<KeyRound size={14} />}
          placeholder="新密码"
          value={newPassword}
          onChange={setNewPassword}
          mode="password"
        />
        <IconInputRow
          icon={<KeyRound size={14} />}
          placeholder="再次输入新密码"
          value={confirmedPassword}
          onChange={setConfirmedPassword}
          mode="password"
        />
        {confirmedPassword && !isMatching && (
          <p className="text-left text-xs text-destructive">两次输入的新密码不一致</p>
        )}
      </div>
    </ConfirmDialog>
  );
}
