import { Globe2, Check, Plus, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import type { TeamConfig } from "../../types/types";
import { joinMember } from "@/api/member";
import { confirmTeamAvatarUploaded, reserveTeamAvatarUpload } from "@/api/team";
import { uploadToPresignedUrl } from "@/features/ComicPlayground/api/page";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { hasRole } from "@/types/role";

type Props = {
  teams: TeamConfig[];
  activeTeam: TeamConfig;
  isListOpen: boolean;
  onToggleList: (nextOpen: boolean) => void;
  onSelectTeam: (team: TeamConfig) => void;
  onJoinTeam: () => void | Promise<void>;
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
}) {
  const resolvedAvatarUrl = localAvatarUrl ?? (team.isAvatarUploaded ? team.avatarUrl : "");

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
        !resolvedAvatarUrl && isListOpen && "bg-green-500",
        !resolvedAvatarUrl && !isListOpen && "bg-[#2e5c33]",
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
            "text-white transition-transform duration-500",
            isListOpen && "rotate-12",
          )}
        />
      )}

      <div
        className={clsx(
          "absolute inset-0 pointer-events-none",
          "transition-colors duration-200",
          canUpload ? "bg-black/0 group-hover/avatar:bg-black/18" : "bg-black/0",
          isUploading && "bg-black/45",
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
          <Upload className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          {uploadProgress !== null && uploadProgress < 100 ? (
            <span className="text-[10px] font-bold text-white/95">{uploadProgress}%</span>
          ) : (
            <span className="text-[10px] font-bold text-white/95">...</span>
          )}
        </div>
      )}
    </button>
  );
}

function TeamList({
  teams,
  activeId,
  onSelect,
  onJoin,
}: {
  teams: TeamConfig[];
  activeId: string;
  onSelect: (team: TeamConfig) => void;
  onJoin: () => void;
}) {
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const handleJoin = async () => {
    const code = inviteCode.trim();
    if (!code || isJoining) return;
    setIsJoining(true);
    const result = await joinMember(code);
    setIsJoining(false);
    if (result.success) {
      setInviteCode("");
      showToast("成功加入汉化组", "success");
      onJoin();
    } else {
      showToast(result.error, "error");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleJoin();
  };

  return (
    <div
      className={clsx(
        "absolute left-full top-0 pl-2 z-100",
        "animate-in fade-in slide-in-from-left-2",
        "duration-200",
      )}
    >
      <div
        className={clsx(
          "w-64 bg-white",
          "border border-gray-100 rounded-sm",
          "shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
          "flex flex-col",
        )}
      >
        <div className="px-5 pt-3 pb-2">
          <h4
            className={clsx(
              "text-[11px] font-black uppercase",
              "tracking-widest text-left",
              "text-gray-400",
            )}
          >
            切换汉化组
          </h4>
        </div>

        <div className="space-y-1 px-2 pb-2">
          {teams.map((t) => {
            const isSelected = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className={clsx(
                  "w-full flex items-center gap-4",
                  "px-4 py-3 rounded-sm transition-all",
                  isSelected ? "bg-green-50" : "text-gray-500 hover:bg-gray-50",
                  isSelected ? "text-green-800" : "hover:text-gray-900",
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-lg flex shrink-0",
                    "items-center justify-center overflow-hidden",
                    "font-black text-sm relative",
                    isSelected
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {t.isAvatarUploaded && t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    t.short
                  )}
                </div>
                <div className={clsx("flex flex-col items-start min-w-0", "text-left")}>
                  <span className="text-sm font-bold truncate w-full">{t.name}</span>
                  <span className="text-[10px] opacity-60 truncate w-full">{t.desc}</span>
                </div>
                {isSelected && (
                  <Check
                    size={16}
                    className={clsx("ml-auto", "text-green-500")}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          className={clsx(
            "border-t border-gray-100",
            "px-3 py-2",
            "flex items-center gap-2",
          )}
        >
          <Plus size={14} className="text-gray-300 shrink-0" />
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入邀请码加入..."
            disabled={isJoining}
            className={clsx(
              "flex-1 min-w-0",
              "text-xs text-gray-600",
              "bg-transparent outline-none",
              "placeholder:text-gray-300",
              isJoining && "opacity-50",
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default function TeamOption({
  teams,
  activeTeam,
  isListOpen,
  onToggleList,
  onSelectTeam,
  onJoinTeam,
  onAvatarUploadingChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { activeMember } = useActiveTeam();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<number | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    onAvatarUploadingChange(isUploadingAvatar);
  }, [isUploadingAvatar, onAvatarUploadingChange]);

  useEffect(() => {
    if (!isUploadingAvatar) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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

  const canUploadTeamAvatar = activeMember !== null && hasRole(activeMember, "admin");

  const handleAvatarFileChange = async (file?: File) => {
    if (!file || isUploadingAvatar || !activeTeam.id || !canUploadTeamAvatar) return;

    const fileNameParts = file.name.split(".");
    const extension = (fileNameParts[fileNameParts.length - 1] || "").toLowerCase();

    if (!extension || !acceptedExtensions.has(extension) || !file.type.startsWith("image/")) {
      showToast("请上传有效的图片文件", "error");
      return;
    }

    const reserveRes = await reserveTeamAvatarUpload(activeTeam.id, {
      fileExtension: extension,
    });
    if (!reserveRes.success) {
      showToast(reserveRes.error, "error");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarUploadProgress(0);

    try {
      const uploadRes = await uploadToPresignedUrl(
        reserveRes.data.putUrl,
        file,
        (percent) => setAvatarUploadProgress(percent),
      );
      if (!uploadRes.success) {
        showToast(uploadRes.error, "error");
        return;
      }

      const confirmRes = await confirmTeamAvatarUploaded(activeTeam.id);
      if (!confirmRes.success) {
        showToast(confirmRes.error, "error");
        return;
      }

      setLocalAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });

      await onJoinTeam();
      showToast("团队头像上传成功", "success");
    } catch (err) {
      console.error("[TeamOption] 上传团队头像异常:", err);
      showToast(err instanceof Error ? err.message : "团队头像上传失败", "error");
    } finally {
      setIsUploadingAvatar(false);
      setAvatarUploadProgress(null);
    }
  };

  const handleToggleList = () => {
    const nextOpen = !isListOpen;
    if (!nextOpen && isUploadingAvatar) {
      setShowExitWarning(true);
      return;
    }
    onToggleList(nextOpen);
  };

  return (
    <div className="relative w-full h-16 group/trans">
      <div className="w-full h-full flex items-center">
        <div
          className={clsx(
            "relative z-10 w-14 shrink-0 h-full",
            "flex items-center justify-center",
          )}
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
              if (isUploadingAvatar || !canUploadTeamAvatar) return;
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
              isListOpen ? "bg-green-50" : "hover:bg-gray-50",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  "text-sm font-bold tracking-wide",
                  "truncate text-[#2e3c33]",
                )}
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
          onJoin={onJoinTeam}
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
          onCancel={() => setShowExitWarning(false)}
        />
      )}
    </div>
  );
}
