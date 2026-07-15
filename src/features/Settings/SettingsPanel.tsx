import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe2, KeyRound, LogOut, Upload } from "lucide-react";
import clsx from "clsx";
import { logoutUser } from "@/api/auth";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import TeamSwitchModal from "./TeamSwitchModal";
import UserAvatarUploadModal from "./UserAvatarUploadModal";
import PasswordResetDialog from "./PasswordResetDialog";
import type { TeamConfig } from "@/features/AppSidebar/types/types";

export default function SettingsPanel() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const loginState = useAppStore((s) => s.loginState);
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const setSelectedTeamId = useAppStore((s) => s.setSelectedTeamId);
  const setAccessToken = useAppStore((s) => s.setAccessToken);
  const setLoginState = useAppStore((s) => s.setLoginState);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const teamConfigs = useMemo<TeamConfig[]>(() => {
    if (!loginState?.memberInfos) return [];
    return loginState.memberInfos
      .filter((m) => m.team)
      .map((m) => {
        const team = m.team!;
        const short = team.name[0].toUpperCase();
        return {
          id: team.id,
          name: team.name,
          short,
          desc: team.description,
          avatarUrl: team.avatarUrl,
          avatarThumbnailUrl: team.avatarThumbnailUrl,
        };
      });
  }, [loginState]);

  const activeTeam =
    teamConfigs.find((t) => t.id === selectedTeamId) ?? teamConfigs[0];

  const currentUser = loginState?.userInfo ?? null;

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error", error);
      showToast(
        error instanceof Error ? error.message : "Failed to logout",
        "error",
      );
    } finally {
      setAccessToken(null);
      setLoginState(null);
      navigate("/login");
    }
  };

  return (
    <div className="flex w-1/3 flex-col gap-4">
      <div
        className={clsx(
          "flex cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-white/80 ring-1 shadow-sm ring-black/5",
          "hover:bg-green-50/80 hover:ring-green-200 hover:text-green-700",
        )}
        onClick={() => setIsTeamModalOpen(true)}
      >
        <span className="text-lg font-medium">切换汉化组</span>
        <Globe2 className="h-5 w-5" />
      </div>

      <button
        type="button"
        className={clsx(
          "flex w-full cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-white/80 ring-1 shadow-sm ring-black/5",
          "hover:bg-amber-50/80 hover:ring-amber-200 hover:text-amber-700",
        )}
        onClick={() => setIsPasswordDialogOpen(true)}
      >
        <span className="text-lg font-medium">重置密码</span>
        <KeyRound className="h-5 w-5" />
      </button>

      <div
        className={clsx(
          "flex cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-white/80 ring-1 shadow-sm ring-black/5",
          "hover:bg-slate-50/80 hover:ring-slate-200 hover:text-slate-700",
        )}
        onClick={() => setIsAvatarModalOpen(true)}
      >
        <span className="text-lg font-medium">上传头像</span>
        <Upload className="h-5 w-5" />
      </div>

      <div
        className={clsx(
          "flex cursor-pointer items-center justify-between",
          "rounded-sm px-6 py-4 transition-colors",
          "bg-white/80 ring-1 shadow-sm ring-black/5",
          "hover:bg-red-50/80 hover:ring-red-200 hover:text-red-500",
        )}
        onClick={handleLogout}
      >
        <span className="text-lg font-medium">退出登录</span>
        <LogOut className="h-5 w-5" />
      </div>

      {isTeamModalOpen && (
        <TeamSwitchModal
          teams={teamConfigs}
          activeTeamId={activeTeam?.id ?? ""}
          onSelect={(team) => {
            setSelectedTeamId(team.id);
            setIsTeamModalOpen(false);
          }}
          onClose={() => setIsTeamModalOpen(false)}
        />
      )}

      {isAvatarModalOpen && currentUser && (
        <UserAvatarUploadModal
          user={currentUser}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}

      {isPasswordDialogOpen && currentUser && (
        <PasswordResetDialog
          userId={currentUser.id}
          onClose={() => setIsPasswordDialogOpen(false)}
        />
      )}
    </div>
  );
}
