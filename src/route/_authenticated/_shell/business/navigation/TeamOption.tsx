import { useSessionOperation } from "@/route/business/session/use-session-operation";
import { Globe2, Upload } from "lucide-react";
import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";
import { allocateTeamAvatar, confirmTeamAvatar } from "@/api/identity/identity-api";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useApiClient } from "@/route/business/api-context";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { useTeamSelection } from "@/route/business/session/use-active-team";
import { hasRole } from "@/route/business/identity/role";
import { TeamModifierModal } from "@/route/_authenticated/_shell/business/navigation/TeamModifierModal";
import type { Result } from "@/shared/utility/result";
import { TeamList } from "@/route/_authenticated/_shell/business/navigation/TeamOptionMenu";

type Props = {
  teams: TeamConfig[];
  activeTeam: TeamConfig;
  isListOpen: boolean;
  onToggleList: (isNextOpen: boolean) => void;
  onSelectTeam: (team: TeamConfig) => void;
  onJoinTeam: () => void | Promise<void>;
  onUpdateTeam?:
    | ((
        id: string,
        args: { name: string; description?: string | undefined },
      ) => Promise<Result<void>>)
    | undefined;
  onAvatarUploadingChange: (isUploading: boolean) => void;
};

function TeamAvatar({
  team,
  localAvatarUrl,
  isListOpen,
  isUploading,
  uploadProgress,
  canUpload,
  onUploadClick,
}: {
  team: TeamConfig;
  localAvatarUrl: string | null;
  isListOpen: boolean;
  isUploading: boolean;
  uploadProgress: number | null;
  canUpload: boolean;
  onUploadClick: () => void;
}): ReactElement {
  const resolvedAvatarUrl = localAvatarUrl ?? team.avatarThumbnailUrl ?? team.avatarUrl;

  return (
    <button
      type="button"
      onClick={onUploadClick}
      title={canUpload ? "上传团队头像" : undefined}
      className={clsx(
        "relative z-10 w-11 h-11 rounded-md overflow-hidden shrink-0",
        "flex items-center justify-center",
        "transition-all duration-300",
        canUpload && "group/avatar",
        isListOpen ? "shadow-md scale-105" : "",
        !resolvedAvatarUrl && isListOpen && "bg-[var(--brand-leaf)]",
        !resolvedAvatarUrl && !isListOpen && "bg-[var(--brand-leaf)]/80",
        canUpload ? "cursor-pointer" : "cursor-default",
      )}
    >
      {resolvedAvatarUrl ? (
        <img
          src={resolvedAvatarUrl}
          alt={team.name}
          className="w-full h-full object-cover [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.12)]"
        />
      ) : (
        <Globe2
          size={22}
          className={clsx(
            "text-ink-white transition-transform duration-500",
            isListOpen && "rotate-12",
          )}
        />
      )}

      <div
        className={clsx(
          "absolute inset-0 pointer-events-none",
          "transition-colors duration-200",
          canUpload
            ? "bg-surface-black/0 group-hover/avatar:bg-surface-black/18"
            : "bg-surface-black/0",
          isUploading && "bg-surface-black/45",
        )}
      />

      {!isUploading && canUpload && (
        <div
          className={clsx(
            "absolute inset-0 z-10 flex items-center justify-center",
            "pointer-events-none opacity-0 group-hover/avatar:opacity-100",
            "transition-opacity duration-200",
          )}
        >
          <Upload className="w-4 h-4 text-ink-white" strokeWidth={2.5} />
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          {uploadProgress !== null && uploadProgress < 100 ? (
            <span className="text-[10px] font-bold text-ink-white/95">{uploadProgress}%</span>
          ) : (
            <span className="text-[10px] font-bold text-ink-white/95">...</span>
          )}
        </div>
      )}
    </button>
  );
}

export function TeamOption({
  teams,
  activeTeam,
  isListOpen,
  onToggleList,
  onSelectTeam,
  onJoinTeam,
  onUpdateTeam,
  onAvatarUploadingChange,
}: Props): ReactElement {
  const client = useApiClient();
  const beginOperation = useSessionOperation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selection = useTeamSelection();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<number | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [teamToModify, setTeamToModify] = useState<TeamConfig | null>(null);

  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    onAvatarUploadingChange(isUploadingAvatar);
  }, [isUploadingAvatar, onAvatarUploadingChange]);

  useEffect(() => {
    if (!isUploadingAvatar) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isUploadingAvatar]);

  useEffect(() => {
    return () => {
      if (localAvatarUrl) {
        URL.revokeObjectURL(localAvatarUrl);
      }
    };
  }, [localAvatarUrl]);

  const acceptedExtensions = useMemo(
    () => new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"]),
    [],
  );

  const canUploadTeamAvatar =
    selection.status === "ready" && hasRole(selection.activeMember, "admin");

  const handleAvatarFileChange = async (file?: File): Promise<void> => {
    if (!file || isUploadingAvatar || !canUploadTeamAvatar) {
      return;
    }

    const fileNameParts = file.name.split(".");
    const extension = (fileNameParts.at(-1) ?? "").toLowerCase();

    if (!extension || !acceptedExtensions.has(extension) || !file.type.startsWith("image/")) {
      showToast("请上传有效的图片文件", "error");
      return;
    }

    const operation = beginOperation();
    setIsUploadingAvatar(true);
    setAvatarUploadProgress(0);

    try {
      const { imageHash } = await hashPageFile(file);
      operation.assertCurrent();
      const allocRes = await allocateTeamAvatar(client, activeTeam.id, {
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
        showToast("团队头像未发生变化", "success");
        return;
      }

      const uploadRes = await client.putPresigned({
        signal: operation.signal,
        url: slot.putUrl,
        file,
        headers: slot.headers,
        onProgress: (percent) => {
          setAvatarUploadProgress(percent);
        },
      });
      operation.assertCurrent();
      if (!uploadRes.success) {
        showLocalApiFailure(uploadRes, showToast);
        return;
      }

      const confirmRes = await confirmTeamAvatar(client, activeTeam.id, slot.imageVersion);
      operation.assertCurrent();
      if (!confirmRes.success) {
        showLocalApiFailure(confirmRes, showToast);
        return;
      }

      setLocalAvatarUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(file);
      });

      await onJoinTeam();
      showToast("团队头像上传成功", "success");
    } catch (error) {
      if (!operation.isCurrent()) return;
      console.error("[TeamOption] 上传团队头像异常:", error);
      showLocalCaughtError(error, showToast, "团队头像上传失败", true);
    } finally {
      if (operation.isCurrent()) {
        setIsUploadingAvatar(false);
        setAvatarUploadProgress(null);
      }
    }
  };

  const handleToggleList = (): void => {
    const isNextOpen = !isListOpen;
    if (!isNextOpen && isUploadingAvatar) {
      setShowExitWarning(true);
      return;
    }
    onToggleList(isNextOpen);
  };

  return (
    <div className="relative w-full h-16 group/trans">
      <div className="w-full h-full flex items-center">
        <div
          className={clsx("relative z-10 w-14 shrink-0 h-full", "flex items-center justify-center")}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void handleAvatarFileChange(file);
            }}
          />

          <TeamAvatar
            team={activeTeam}
            localAvatarUrl={localAvatarUrl}
            isListOpen={isListOpen}
            isUploading={isUploadingAvatar}
            uploadProgress={avatarUploadProgress}
            canUpload={canUploadTeamAvatar}
            onUploadClick={() => {
              if (isUploadingAvatar || !canUploadTeamAvatar) {
                return;
              }
              fileInputRef.current?.click();
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleToggleList}
          className={clsx(
            "absolute left-14 right-2 h-full outline-none",
            "flex flex-col justify-center",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-100 delay-0",
            "group-hover:duration-300",
            "group-hover:delay-150",
          )}
        >
          <div
            className={clsx(
              "px-2 py-2 rounded-sm h-11",
              "flex flex-col justify-center",
              "transition-colors duration-300",
              isListOpen ? "bg-surface-gray-100/60" : "hover:bg-surface-gray-100/80",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={clsx("text-sm font-bold tracking-wide", "truncate text-heading-forest")}
              >
                {activeTeam.name}
              </span>
            </div>
          </div>
        </button>
      </div>

      {isListOpen && (
        <TeamList
          teams={teams}
          activeId={activeTeam.id}
          onSelect={onSelectTeam}
          onJoin={() => {
            void onJoinTeam();
          }}
          onLongPressTeam={
            onUpdateTeam
              ? (t) => {
                  setTeamToModify(t);
                  onToggleList(false);
                }
              : undefined
          }
        />
      )}

      {showExitWarning && (
        <ConfirmDialog
          title="头像上传尚未完成"
          description="当前正在上传并记录团队头像。现在退出可能导致未完成确认，请继续等待或确认退出。"
          confirmLabel="确认退出"
          cancelLabel="继续等待"
          onConfirm={() => {
            setShowExitWarning(false);
            onToggleList(false);
          }}
          onCancel={() => {
            setShowExitWarning(false);
          }}
        />
      )}
      {teamToModify && onUpdateTeam && (
        <TeamModifierModal
          team={teamToModify}
          onUpdate={async (args) => {
            const res = await onUpdateTeam(teamToModify.id, args);
            return res;
          }}
          onClose={() => {
            setTeamToModify(null);
          }}
        />
      )}
    </div>
  );
}
