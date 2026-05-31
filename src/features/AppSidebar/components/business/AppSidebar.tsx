import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import type { NavId, TeamConfig } from "../../types/types";
import { mainNavConfigs, footerNavConfig } from "../../config/config";
import { useAppStore } from "@/store/app";
import { updateTeam } from "@/api/team";
import { hasRole } from "@/types/role";
import { useTeamConfigs } from "../../hook/useTeamConfigs";
import AppSidebarLayout from "../../layouts/AppSidebarLayout";
import TitleHeader from "./TitleHeader";
import TeamOption from "./TeamOption";
import NavItem from "./NavItem";
import SettingsFooter from "./SettingsFooter";

const navPathMap: Record<NavId, string> = {
  ...Object.fromEntries(mainNavConfigs.map((c) => [c.id, c.path])),
  settings: footerNavConfig.path,
} as Record<NavId, string>;

const pathNavMap: Record<string, NavId> = Object.fromEntries(
  Object.entries(navPathMap).map(([id, path]) => [path, id as NavId]),
);

const FALLBACK_TEAM: TeamConfig = {
  id: "",
  name: "",
  short: "",
  desc: "",
  avatarUrl: "",
  isAvatarUploaded: false,
};

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const setSelectedTeamId = useAppStore((s) => s.setSelectedTeamId);
  const sysMailCache = useAppStore((s) => s.sysMailCache);
  const loginState = useAppStore((s) => s.loginState);
  const hasUnread = sysMailCache?.mails.some((m) => !m.read) ?? false;

  const isTeamAdmin = useMemo(() => {
    const member = loginState?.memberInfos.find((m) => m.teamId === selectedTeamId);
    return member !== undefined && hasRole(member, "admin");
  }, [loginState?.memberInfos, selectedTeamId]);

  const [isHovered, setIsHovered] = useState(false);
  const [isSelectingTeam, setIsSelectingTeam] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const isExpanded = isHovered || isSelectingTeam;

  const { teamConfigs, refreshTeams } = useTeamConfigs();

  const resolvedActiveTeam =
    teamConfigs.find((team) => team.id === selectedTeamId) ??
    teamConfigs[0] ?? FALLBACK_TEAM;

  const activeNavId = pathNavMap[location.pathname] ?? "workspace";

  const handleNavSelect = (id: NavId) => {
    navigate(navPathMap[id]);
  };

  const handleTeamSelect = (team: TeamConfig) => {
    setSelectedTeamId(team.id);
    setIsSelectingTeam(false);
  };

  const handleUpdateTeam = useCallback(
    async (id: string, args: { name: string; description?: string }) => {
      const result2 = await updateTeam({ id, ...args });
      if (!result2.success) {
        console.error("[AppSidebar] 更新汉化组信息失败:", result2.error);
        return result2;
      }
      await refreshTeams();
      return result2;
    },
    [refreshTeams],
  );
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isAvatarUploading) return;
    setIsSelectingTeam(false);
  };

  useEffect(() => {
    if (!isAvatarUploading && !isHovered && isSelectingTeam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSelectingTeam(false);
    }
  }, [isAvatarUploading, isHovered, isSelectingTeam]);

  return (
    <AppSidebarLayout
      isExpanded={isExpanded}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      header={<TitleHeader />}
      teamOption={
        <TeamOption
          teams={teamConfigs}
          activeTeam={resolvedActiveTeam}
          isListOpen={isSelectingTeam}
          onToggleList={setIsSelectingTeam}
          onSelectTeam={handleTeamSelect}
          onJoinTeam={refreshTeams}
          onUpdateTeam={isTeamAdmin ? handleUpdateTeam : undefined}
          onAvatarUploadingChange={setIsAvatarUploading}
        />
      }
      nav={
        <>
          {mainNavConfigs.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeNavId === item.id}
              onClick={() => handleNavSelect(item.id)}
              hasBadge={item.id === "system-mail" && hasUnread}
            />
          ))}
        </>
      }
      footer={
        <SettingsFooter
          config={footerNavConfig}
          isActive={activeNavId === "settings"}
          onClick={() => handleNavSelect("settings")}
        />
      }
    />
  );
}
