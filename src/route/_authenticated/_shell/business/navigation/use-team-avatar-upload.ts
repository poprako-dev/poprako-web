import { useEffect, useState } from "react";
import { allocateTeamAvatar, confirmTeamAvatar } from "@/api/identity/identity-api";
import { useApiClient } from "@/route/business/api-context";
import { useSessionOperation } from "@/route/business/session/use-session-operation";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import { hasRole } from "@/route/business/identity/role";
import { useTeamSelection } from "@/route/business/session/use-active-team";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";

type UploadOperation = ReturnType<ReturnType<typeof useSessionOperation>>;
type UploadDependencies = {
  client: ReturnType<typeof useApiClient>;
  teamId: string;
  file: File;
  extension: string;
  operation: UploadOperation;
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
  onProgress: (progress: number | null) => void;
  onUploaded: (file: File) => void;
  onJoinTeam: () => void | Promise<void>;
};

const ACCEPTED_AVATAR_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]);

function useRevokeAvatarUrl(localAvatarUrl: string | null): void {
  useEffect(() => {
    return () => {
      if (localAvatarUrl) {
        URL.revokeObjectURL(localAvatarUrl);
      }
    };
  }, [localAvatarUrl]);
}

function replaceLocalAvatarUrl(
  setLocalAvatarUrl: (update: (previous: string | null) => string) => void,
  file: File,
): void {
  setLocalAvatarUrl((previous) => {
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    return URL.createObjectURL(file);
  });
}

type AvatarChangeDependencies = Omit<UploadDependencies, "file" | "extension" | "operation"> & {
  beginOperation: () => UploadOperation;
  isUploading: boolean;
  canUpload: boolean;
  acceptedExtensions: Set<string>;
  setIsUploading: (isUploading: boolean) => void;
  setProgress: (progress: number | null) => void;
};

async function processAvatarFileChange(
  file: File | undefined,
  deps: AvatarChangeDependencies,
): Promise<void> {
  if (!file || deps.isUploading || !deps.canUpload) {
    return;
  }
  const extension = (file.name.split(".").at(-1) ?? "").toLowerCase();
  if (!extension || !deps.acceptedExtensions.has(extension) || !file.type.startsWith("image/")) {
    deps.showToast("请上传有效的图片文件", "error");
    return;
  }
  const operation = deps.beginOperation();
  deps.setIsUploading(true);
  deps.setProgress(0);
  try {
    await uploadAvatar({ ...deps, file, extension, operation });
  } catch (error) {
    if (!operation.isCurrent()) {
      return;
    }
    console.error("[TeamOption] 上传团队头像异常:", error);
    showLocalCaughtError(error, deps.showToast, "团队头像上传失败", true);
  } finally {
    if (operation.isCurrent()) {
      deps.setIsUploading(false);
      deps.setProgress(null);
    }
  }
}

async function uploadAvatar(deps: UploadDependencies): Promise<void> {
  const { client, teamId, file, extension, operation, showToast } = deps;
  const { imageHash } = await hashPageFile(file);
  operation.assertCurrent();
  const allocation = await allocateTeamAvatar(client, teamId, {
    imageHash,
    newByteLen: file.size,
    ext: extension,
  });
  operation.assertCurrent();
  if (!allocation.success) {
    showLocalApiFailure(allocation, showToast);
    return;
  }
  if (allocation.data === null) {
    showToast("团队头像未发生变化", "success");
    return;
  }
  await uploadAndConfirm(deps, allocation.data);
}

async function uploadAndConfirm(
  deps: UploadDependencies,
  slot: { putUrl: string; headers: Record<string, string>; imageVersion: number },
): Promise<void> {
  const { client, teamId, file, operation, showToast } = deps;
  const uploaded = await client.putPresigned({
    signal: operation.signal,
    url: slot.putUrl,
    file,
    headers: slot.headers,
    onProgress: deps.onProgress,
  });
  operation.assertCurrent();
  if (!uploaded.success) {
    showLocalApiFailure(uploaded, showToast);
    return;
  }
  const confirmed = await confirmTeamAvatar(client, teamId, slot.imageVersion);
  operation.assertCurrent();
  if (!confirmed.success) {
    showLocalApiFailure(confirmed, showToast);
    return;
  }
  deps.onUploaded(file);
  await deps.onJoinTeam();
  showToast("团队头像上传成功", "success");
}

export function useTeamAvatarUpload(
  activeTeam: TeamConfig,
  onJoinTeam: () => void | Promise<void>,
): {
  isUploadingAvatar: boolean;
  avatarUploadProgress: number | null;
  localAvatarUrl: string | null;
  canUploadTeamAvatar: boolean;
  handleAvatarFileChange: (file?: File) => Promise<void>;
} {
  const client = useApiClient();
  const beginOperation = useSessionOperation();
  const selection = useTeamSelection();
  const showToast = useToastStore((state) => state.showToast);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<number | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const canUploadTeamAvatar =
    selection.status === "ready" && hasRole(selection.activeMember, "admin");

  useRevokeAvatarUrl(localAvatarUrl);

  const handleAvatarFileChange = async (file?: File): Promise<void> => {
    await processAvatarFileChange(file, {
      client,
      teamId: activeTeam.id,
      beginOperation,
      showToast,
      onProgress: setAvatarUploadProgress,
      onUploaded: (uploadedFile: File) => {
        replaceLocalAvatarUrl(setLocalAvatarUrl, uploadedFile);
      },
      onJoinTeam,
      isUploading: isUploadingAvatar,
      canUpload: canUploadTeamAvatar,
      acceptedExtensions: ACCEPTED_AVATAR_EXTENSIONS,
      setIsUploading: setIsUploadingAvatar,
      setProgress: setAvatarUploadProgress,
    });
  };

  return {
    isUploadingAvatar,
    avatarUploadProgress,
    localAvatarUrl,
    canUploadTeamAvatar,
    handleAvatarFileChange,
  };
}
