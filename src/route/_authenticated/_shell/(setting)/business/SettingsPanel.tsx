import { type JSX, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileDown, Globe2, KeyRound, LogOut, Upload } from "lucide-react";
import clsx from "clsx";
import { logoutUser } from "@/api/identity/identity-api";
import { showLocalCaughtError, toApiRequestError } from "@/route/business/request-error";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { downloadConsoleLogs } from "@/shared/utility/console-log";
import { TeamSwitchModal } from "@/route/_authenticated/_shell/(setting)/business/TeamSwitchModal";
import { UserAvatarUploadModal } from "@/route/_authenticated/_shell/(setting)/business/UserAvatarUploadModal";
import { PasswordResetDialog } from "@/route/_authenticated/_shell/(setting)/business/PasswordResetDialog";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";
import { clearSession, selectTeam } from "@/route/business/session/session";

import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";

export function SettingsPanel(): JSX.Element {
  const client = useApiClient();
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const loginState = useReadySession();
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const teamConfigs = useMemo<TeamConfig[]>(() => {
    return loginState.memberInfos.flatMap((m) => {
      const team = m.team;
      const short = team.name[0]?.toUpperCase() ?? "";
      return [
        {
          id: team.id,
          name: team.name,
          short,
          desc: team.description,
          avatarUrl: team.avatarUrl,
          avatarThumbnailUrl: team.avatarThumbnailUrl,
        },
      ];
    });
  }, [loginState]);

  const activeTeam = teamConfigs.find((t) => t.id === selectedTeamId) ?? teamConfigs[0];

  const currentUser = loginState.userInfo;

  const handleLogout = async (): Promise<void> => {
    try {
      const result = await logoutUser(client);
      if (!result.success) throw toApiRequestError(result);
    } catch (error) {
      console.error("Logout error", error);
      showLocalCaughtError(error, showToast, "退出登录失败，已清理本机登录状态", true);
    } finally {
      clearSession();
      void navigate({ to: "/login" });
    }
  };

  const handleExportLogs = (): void => {
    const count = downloadConsoleLogs();
    showToast(`已导出 ${String(count)} 条当前会话日志`, "success");
  };

  return (
    <div className="flex w-5/6 flex-col gap-4 sm:w-1/2 lg:w-1/3">
      {teamConfigs.length > 0 ? (
        <button
          type="button"
          className={clsx(
            "flex w-full cursor-pointer items-center justify-between",
            "rounded-sm px-6 py-4 transition-colors",
            "bg-surface-panel ring-1 shadow-sm ring-border/50",
            "hover:bg-primary-subtle/80 hover:ring-primary-border hover:text-primary-text",
          )}
          onClick={() => {
            setIsTeamModalOpen(true);
          }}
        >
          <span className="text-lg font-medium">切换汉化组</span>
          <Globe2 className="h-5 w-5" />
        </button>
      ) : (
        <p className="px-6 py-4 text-sm text-muted-foreground">你还没有加入汉化组</p>
      )}

      <button
        type="button"
        className={clsx(
          "flex w-full cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-surface-panel ring-1 shadow-sm ring-border/50",
          "hover:bg-status-warning/10 hover:ring-status-warning/30 hover:text-status-warning",
        )}
        onClick={() => {
          setIsPasswordDialogOpen(true);
        }}
      >
        <span className="text-lg font-medium">重置密码</span>
        <KeyRound className="h-5 w-5" />
      </button>

      <button
        type="button"
        className={clsx(
          "flex cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-surface-panel ring-1 shadow-sm ring-border/50",
          "hover:bg-muted hover:ring-border hover:text-foreground",
        )}
        onClick={() => {
          setIsAvatarModalOpen(true);
        }}
      >
        <span className="text-lg font-medium">上传头像</span>
        <Upload className="h-5 w-5" />
      </button>

      <button
        type="button"
        className={clsx(
          "flex w-full cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-surface-panel ring-1 shadow-sm ring-border/50",
          "hover:bg-muted hover:ring-border hover:text-foreground",
        )}
        onClick={handleExportLogs}
      >
        <span className="text-lg font-medium">导出日志</span>
        <FileDown className="h-5 w-5" />
      </button>

      <button
        type="button"
        className={clsx(
          "flex cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-surface-panel ring-1 shadow-sm ring-border/50",
          "hover:bg-destructive/10 hover:ring-destructive/30 hover:text-destructive",
        )}
        onClick={() => {
          void handleLogout();
        }}
      >
        <span className="text-lg font-medium">退出登录</span>
        <LogOut className="h-5 w-5" />
      </button>

      {isTeamModalOpen && activeTeam && (
        <TeamSwitchModal
          teams={teamConfigs}
          activeTeamId={activeTeam.id}
          onSelect={(team) => {
            selectTeam(team.id);
            setIsTeamModalOpen(false);
          }}
          onClose={() => {
            setIsTeamModalOpen(false);
          }}
        />
      )}

      {isAvatarModalOpen && (
        <UserAvatarUploadModal
          user={currentUser}
          onClose={() => {
            setIsAvatarModalOpen(false);
          }}
        />
      )}

      {isPasswordDialogOpen && (
        <PasswordResetDialog
          userId={currentUser.id}
          onClose={() => {
            setIsPasswordDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
