import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Upload, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { confirmUserAvatarUploaded, reserveUserAvatarUpload } from "@/api/user";
import { uploadToPresignedUrl } from "@/features/ComicPlayground/api/page";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { useRefreshLoginState } from "@/hooks/useRefreshLoginState";
import type { UserInfo } from "@/types/user";

type Props = {
  user: UserInfo;
  onClose: () => void;
};

const ACCEPTED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "avif",
]);

export default function UserAvatarUploadModal({ user, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToastStore();
  const refreshLoginState = useRefreshLoginState();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const resolvedAvatarUrl =
    localAvatarUrl ?? (user.isAvatarUploaded && user.avatarUrl ? user.avatarUrl : "");

  useEffect(() => {
    return () => {
      if (localAvatarUrl) {
        URL.revokeObjectURL(localAvatarUrl);
      }
    };
  }, [localAvatarUrl]);

  useEffect(() => {
    if (!isUploading) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  const handleRequestClose = () => {
    if (isUploading) {
      setShowExitWarning(true);
      return;
    }
    onClose();
  };

  const handleSelectFile = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFile = async (file?: File) => {
    if (!file || isUploading) return;

    const fileNameParts = file.name.split(".");
    const extension = (fileNameParts[fileNameParts.length - 1] || "").toLowerCase();

    if (!extension || !ACCEPTED_EXTENSIONS.has(extension) || !file.type.startsWith("image/")) {
      showToast("请上传有效的图片文件", "error");
      return;
    }

    const reserveRes = await reserveUserAvatarUpload(user.id, extension);
    if (!reserveRes.success) {
      showToast(reserveRes.error, "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadRes = await uploadToPresignedUrl(
        reserveRes.data.putUrl,
        file,
        (percent) => setUploadProgress(percent),
      );
      if (!uploadRes.success) {
        showToast(uploadRes.error, "error");
        return;
      }

      const confirmRes = await confirmUserAvatarUploaded(
        user.id,
        reserveRes.data.avatarVersion,
      );
      if (!confirmRes.success) {
        showToast(confirmRes.error, "error");
        return;
      }

      setLocalAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });

      const refreshRes = await refreshLoginState();
      if (!refreshRes.success) {
        showToast(refreshRes.error, "error");
      }

      showToast("头像上传成功", "success");
    } catch (err) {
      console.error("[UserAvatarUploadModal] 上传头像异常:", err);
      showToast(err instanceof Error ? err.message : "头像上传失败", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return createPortal(
    <>
      <div
        className={clsx(
          "fixed inset-0 z-[9999] flex items-center justify-center",
          "bg-black/15 backdrop-blur-[1px]",
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleRequestClose();
        }}
      >
        <div
          className={clsx(
            "w-80 bg-white rounded-sm border border-slate-200",
            "shadow-md shadow-slate-200/80 px-5 py-4",
            "flex flex-col gap-4",
          )}
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-slate-600">上传头像</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              仅可上传你自己的头像。上传完成前请勿关闭弹窗。
            </p>
          </div>

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
                "relative w-28 h-28 rounded-full overflow-hidden",
                "border border-slate-200 bg-slate-100",
                "group/avatar transition-all",
                isUploading
                  ? "cursor-progress"
                  : "cursor-pointer hover:shadow-sm active:scale-[0.99]",
              )}
            >
              {resolvedAvatarUrl ? (
                <img
                  src={resolvedAvatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <UserIcon size={30} />
                </div>
              )}

              <div
                className={clsx(
                  "absolute inset-0 transition-colors",
                  isUploading
                    ? "bg-black/45"
                    : "bg-black/0 group-hover/avatar:bg-black/18",
                )}
              />

              {!isUploading && (
                <div
                  className={clsx(
                    "absolute inset-0 flex items-center justify-center",
                    "opacity-0 group-hover/avatar:opacity-100 transition-opacity",
                  )}
                >
                  <Upload className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white/95">
                    {uploadProgress !== null && uploadProgress < 100
                      ? `${uploadProgress}%`
                      : "..."}
                  </span>
                </div>
              )}
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleRequestClose}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-xs",
                "text-slate-400 hover:text-slate-600",
                "border border-slate-200 hover:border-slate-300",
                "bg-white hover:bg-slate-50",
                "transition-colors",
              )}
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      {showExitWarning && (
        <ConfirmDialog
          title="头像上传尚未完成"
          description="当前正在上传并记录头像。现在退出可能导致未完成确认，请继续等待或确认退出。"
          confirmLabel="确认退出"
          cancelLabel="继续等待"
          onConfirm={() => {
            setShowExitWarning(false);
            onClose();
          }}
          onCancel={() => setShowExitWarning(false)}
        />
      )}
    </>,
    document.body,
  );
}
