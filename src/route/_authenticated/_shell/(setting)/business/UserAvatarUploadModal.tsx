import { useSessionOperation } from "@/route/business/session/use-session-operation";
import { type JSX, useEffect, useRef, useState } from "react";
import { Upload, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { allocateUserAvatar, confirmUserAvatar } from "@/api/identity/identity-api";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useApiClient } from "@/route/business/api-context";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useRefreshLoginState } from "@/route/business/session/use-refresh-session";
import type { UserInfo } from "@/route/business/identity/user";

type Props = {
  user: UserInfo;
  onClose: () => void;
};

const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);

export function UserAvatarUploadModal({ user, onClose }: Props): JSX.Element {
  const client = useApiClient();
  const beginOperation = useSessionOperation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToastStore();
  const refreshLoginState = useRefreshLoginState();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const resolvedAvatarUrl = localAvatarUrl ?? user.avatarThumbnailUrl ?? user.avatarUrl;

  useEffect(() => {
    return () => {
      if (localAvatarUrl) {
        URL.revokeObjectURL(localAvatarUrl);
      }
    };
  }, [localAvatarUrl]);

  useEffect(() => {
    if (!isUploading) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = ""; // eslint-disable-line @typescript-eslint/no-deprecated
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isUploading]);

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

  const handleAvatarFile = async (file?: File): Promise<void> => {
    if (!file || isUploading) return;

    const fileNameParts = file.name.split(".");
    const extension = (fileNameParts.at(-1) ?? "").toLowerCase();

    if (!extension || !ACCEPTED_EXTENSIONS.has(extension) || !file.type.startsWith("image/")) {
      showToast("请上传有效的图片文件", "error");
      return;
    }

    const operation = beginOperation();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { imageHash } = await hashPageFile(file);
      operation.assertCurrent();
      const allocRes = await allocateUserAvatar(client, user.id, {
        imageHash,
        newByteLen: file.size,
        ext: extension,
      });
      operation.assertCurrent();
      if (!allocRes.success) {
        showLocalApiFailure(allocRes, showToast);
        return;
      }

      const slot = allocRes.data;
      if (slot === null) {
        showToast("头像图片未发生变化", "success");
        return;
      }

      const uploadRes = await client.putPresigned({
        signal: operation.signal,
        url: slot.putUrl,
        file,
        headers: slot.headers,
        onProgress: (percent) => {
          setUploadProgress(percent);
        },
      });
      operation.assertCurrent();
      if (!uploadRes.success) {
        showLocalApiFailure(uploadRes, showToast);
        return;
      }

      const confirmRes = await confirmUserAvatar(client, user.id, slot.imageVersion);
      operation.assertCurrent();
      if (!confirmRes.success) {
        showLocalApiFailure(confirmRes, showToast);
        return;
      }

      setLocalAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });

      const refreshRes = await refreshLoginState();
      if (!refreshRes.success) {
        showLocalApiFailure(refreshRes, showToast);
      }

      showToast("头像上传成功", "success");
    } catch (error) {
      if (!operation.isCurrent()) return;
      console.error("[UserAvatarUploadModal] 上传头像异常:", error);
      showLocalCaughtError(error, showToast, "头像上传失败", true);
    } finally {
      if (operation.isCurrent()) {
        setIsUploading(false);
        setUploadProgress(null);
      }
    }
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
              "border border-border bg-surface-hover transition-all",
              isUploading
                ? "cursor-progress"
                : "cursor-pointer hover:shadow-sm active:scale-[0.99]",
            )}
          >
            {resolvedAvatarUrl ? (
              <img src={resolvedAvatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <UserIcon size={30} />
              </div>
            )}

            <div
              className={clsx(
                "absolute inset-0 transition-colors",
                isUploading ? "bg-overlay" : "bg-overlay/0 group-hover/avatar:bg-overlay/40",
              )}
            />

            {!isUploading && (
              <div
                className={clsx(
                  "absolute inset-0 flex items-center justify-center",
                  "opacity-0 transition-opacity group-hover/avatar:opacity-100",
                )}
              >
                <Upload className="size-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-primary-foreground/95">
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
