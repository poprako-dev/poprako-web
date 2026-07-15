import { useState } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconInputRow from "@/components/ui/IconInputRow";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { updateUserPassword } from "@/api/user";

type Props = {
  userId: string;
  onClose: () => void;
};

export default function PasswordResetDialog({ userId, onClose }: Props) {
  const { showToast } = useToastStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isComplete = Boolean(currentPassword && newPassword && confirmedPassword);
  const isMatching = newPassword === confirmedPassword;

  const handleConfirm = async () => {
    if (!isComplete || !isMatching) return;

    setIsSubmitting(true);
    const result = await updateUserPassword(userId, {
      currentPassword,
      newPassword,
    });
    setIsSubmitting(false);

    if (!result.success) {
      console.error("Failed to reset password", result.error);
      showToast(result.error, "error");
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
      onConfirm={handleConfirm}
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
          password
        />
        <IconInputRow
          icon={<KeyRound size={14} />}
          placeholder="新密码"
          value={newPassword}
          onChange={setNewPassword}
          password
        />
        <IconInputRow
          icon={<KeyRound size={14} />}
          placeholder="再次输入新密码"
          value={confirmedPassword}
          onChange={setConfirmedPassword}
          password
        />
        {confirmedPassword && !isMatching && (
          <p className="text-left text-xs text-red-500">两次输入的新密码不一致</p>
        )}
      </div>
    </ConfirmDialog>
  );
}
