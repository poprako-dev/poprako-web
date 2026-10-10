import { useEffect, useState } from "react";
import { allocateUserAvatar, confirmUserAvatar } from "@/api/identity/identity-api";
import { useSessionOperation } from "@/route/business/session/use-session-operation";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useApiClient } from "@/route/business/api-context";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useRefreshLoginState } from "@/route/business/session/use-refresh-session";
import type { UserInfo } from "@/route/business/identity/user";
import type { Result } from "@/shared/utility/result";

const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);
type Operation = ReturnType<ReturnType<typeof useSessionOperation>>;
type Client = ReturnType<typeof useApiClient>;
type Toast = ReturnType<typeof useToastStore.getState>["showToast"];

type UploadDependencies = {
  client: Client;
  userId: string;
  file: File;
  extension: string;
  operation: Operation;
  showToast: Toast;
  onProgress: (progress: number | null) => void;
  onUploaded: (file: File) => void;
  refreshLoginState: ReturnType<typeof useRefreshLoginState>;
};

type AvatarHandlerDependencies = Omit<UploadDependencies, "file" | "extension" | "operation"> & {
  isUploading: boolean;
  beginOperation: () => Operation;
  setIsUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number | null) => void;
};

async function processAvatarFile(
  file: File | undefined,
  deps: AvatarHandlerDependencies,
): Promise<void> {
  if (!file || deps.isUploading) {
    return;
  }
  const extension = (file.name.split(".").at(-1) ?? "").toLowerCase();
  if (!extension || !ACCEPTED_EXTENSIONS.has(extension) || !file.type.startsWith("image/")) {
    deps.showToast("请上传有效的图片文件", "error");
    return;
  }
  const operation = deps.beginOperation();
  deps.setIsUploading(true);
  deps.setUploadProgress(0);
  try {
    await uploadAvatar({ ...deps, file, extension, operation });
  } catch (error) {
    if (!operation.isCurrent()) {
      return;
    }
    console.error("[UserAvatarUploadModal] 上传头像异常:", error);
    showLocalCaughtError(error, deps.showToast, "头像上传失败", true);
  } finally {
    if (operation.isCurrent()) {
      deps.setIsUploading(false);
      deps.setUploadProgress(null);
    }
  }
}

async function uploadFileToSlot(
  client: Client,
  file: File,
  operation: Operation,
  slot: { putUrl: string; headers: Record<string, string>; imageVersion: number },
  onProgress: (progress: number | null) => void,
): Promise<Result<void>> {
  const uploadResult = await client.putPresigned({
    signal: operation.signal,
    url: slot.putUrl,
    file,
    headers: slot.headers,
    onProgress,
  });
  operation.assertCurrent();
  return uploadResult;
}

async function uploadAvatar(deps: UploadDependencies): Promise<void> {
  const { client, userId, file, extension, operation, showToast } = deps;
  const { imageHash } = await hashPageFile(file);
  operation.assertCurrent();
  const allocation = await allocateUserAvatar(client, userId, {
    imageHash,
    newByteLen: file.size,
    ext: extension,
  });
  operation.assertCurrent();
  if (!allocation.success) {
    showLocalApiFailure(allocation, showToast);
    return;
  }
  if (!allocation.data) {
    showToast("头像图片未发生变化", "success");
    return;
  }
  await confirmAvatarUpload(deps, allocation.data);
}

async function confirmAvatarUpload(
  deps: UploadDependencies,
  slot: { putUrl: string; headers: Record<string, string>; imageVersion: number },
): Promise<void> {
  const { client, userId, file, operation, showToast } = deps;
  const uploaded = await uploadFileToSlot(client, file, operation, slot, deps.onProgress);
  if (!uploaded.success) {
    showLocalApiFailure(uploaded, showToast);
    return;
  }
  const confirmed = await confirmUserAvatar(client, userId, slot.imageVersion);
  operation.assertCurrent();
  if (!confirmed.success) {
    showLocalApiFailure(confirmed, showToast);
    return;
  }
  deps.onUploaded(file);
  const refreshed = await deps.refreshLoginState();
  if (!refreshed.success) {
    showLocalApiFailure(refreshed, showToast);
  }
  showToast("头像上传成功", "success");
}

function useRevokeLocalAvatar(localAvatarUrl: string | null): void {
  useEffect(() => {
    return () => {
      if (localAvatarUrl) {
        URL.revokeObjectURL(localAvatarUrl);
      }
    };
  }, [localAvatarUrl]);
}

function usePreventUnloadWhileUploading(isUploading: boolean): void {
  useEffect(() => {
    if (!isUploading) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = ""; // eslint-disable-line @typescript-eslint/no-deprecated
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isUploading]);
}

export function useUserAvatarUpload(user: UserInfo): {
  isUploading: boolean;
  uploadProgress: number | null;
  localAvatarUrl: string | null;
  handleAvatarFile: (file?: File) => Promise<void>;
} {
  const client = useApiClient();
  const beginOperation = useSessionOperation();
  const { showToast } = useToastStore();
  const refreshLoginState = useRefreshLoginState();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  useRevokeLocalAvatar(localAvatarUrl);
  usePreventUnloadWhileUploading(isUploading);

  const handleAvatarFile = async (file?: File): Promise<void> => {
    await processAvatarFile(file, {
      client,
      userId: user.id,
      beginOperation,
      showToast,
      onProgress: setUploadProgress,
      onUploaded: (uploadedFile) => {
        setLocalAvatarUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return URL.createObjectURL(uploadedFile);
        });
      },
      refreshLoginState,
      isUploading,
      setIsUploading,
      setUploadProgress,
    });
  };

  return { isUploading, uploadProgress, localAvatarUrl, handleAvatarFile };
}
