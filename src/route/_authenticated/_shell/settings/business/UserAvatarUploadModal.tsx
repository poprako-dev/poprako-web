import { type JSX, useRef, useState } from "react";
import { Upload, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import type { UserInfo } from "@/route/business/identity/user";
import { useUserAvatarUpload } from "@/route/_authenticated/_shell/settings/business/use-user-avatar-upload";

type Props = {
  user: UserInfo;
  onClose: () => void;
};

export function UserAvatarUploadModal({ user, onClose }: Props): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isUploading, uploadProgress, localAvatarUrl, handleAvatarFile } =
    useUserAvatarUpload(user);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const resolvedAvatarUrl = localAvatarUrl ?? user.avatarThumbnailUrl ?? user.avatarUrl;

  const handleRequestClose = (): void => {
    if (isUploading) {
      setShowExitWarning(true);
      return;
    }
    onClose();
  };

  const handleSelectFile = (): void => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <>
      <AppDialog
        title="上传头像"
        description="仅可上传你自己的头像。上传完成前请勿关闭弹窗。"
        size="default"
        onClose={handleRequestClose}
        closeOnEscape={false}
        footer={
          <div className="flex">
            <AppDialogAction onClick={handleRequestClose}>关闭</AppDialogAction>
          </div>
        }
      >
        <div className="flex items-center justify-center py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void handleAvatarFile(file);
            }}
          />

          <button
            type="button"
            onClick={handleSelectFile}
            disabled={isUploading}
            className={clsx(
              "group/avatar relative size-28 overflow-hidden rounded-full",
              "border border-line-slate-200 bg-surface-slate-100 transition-all",
              isUploading
                ? "cursor-progress"
                : "cursor-pointer hover:shadow-sm active:scale-[0.99]",
            )}
          >
            {resolvedAvatarUrl ? (
              <img src={resolvedAvatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted-cool">
                <UserIcon size={30} />
              </div>
            )}

            <div
              className={clsx(
                "absolute inset-0 transition-colors",
                isUploading
                  ? "bg-surface-black/45"
                  : "bg-surface-black/0 group-hover/avatar:bg-surface-black/18",
              )}
            />

            {!isUploading && (
              <div
                className={clsx(
                  "absolute inset-0 flex items-center justify-center",
                  "opacity-0 transition-opacity group-hover/avatar:opacity-100",
                )}
              >
                <Upload
                  className="size-7 rounded bg-image-label-overlay p-1 text-ink-white"
                  strokeWidth={2.5}
                />
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-image-label-foreground bg-image-label-overlay rounded px-1 py-0.5">
                  {uploadProgress !== null && uploadProgress < 100
                    ? `${String(uploadProgress)}%`
                    : "..."}
                </span>
              </div>
            )}
          </button>
        </div>
      </AppDialog>

      {showExitWarning && (
        <ConfirmDialog
          title="头像上传尚未完成"
          description={"当前正在上传并记录头像。现在退出可能导致未完成确认，请继续等待或确认退出。"}
          confirmLabel="确认退出"
          cancelLabel="继续等待"
          onConfirm={() => {
            setShowExitWarning(false);
            onClose();
          }}
          onCancel={() => {
            setShowExitWarning(false);
          }}
        />
      )}
    </>
  );
}
