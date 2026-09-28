import { type ReactElement, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import type {
  NavId,
  TeamConfig,
} from "@/routes/_authenticated/_shell/business/navigation/app-sidebar-type";
import {
  footerNavConfig,
  mainNavConfigs,
  utilityNavConfig,
} from "@/routes/_authenticated/_shell/business/navigation/navigation-config";
import { useAppStore } from "@/routes/business/session/session-store";
import { useMailStore } from "@/routes/_authenticated/_shell/business/mail/mail-store";
import { updateTeam } from "@/routes/business/identity/team-request";
import { hasRole } from "@/routes/business/identity/role";
import { useTeamConfigs } from "@/routes/_authenticated/_shell/business/navigation/use-team-configs";
import { AppSidebarLayout } from "@/routes/_authenticated/_shell/business/navigation/AppSidebarLayout";
import { TitleHeader } from "@/routes/_authenticated/_shell/business/navigation/TitleHeader";
import { TeamOption } from "@/routes/_authenticated/_shell/business/navigation/TeamOption";
import { NavItem } from "@/routes/_authenticated/_shell/business/navigation/NavItem";
import { SettingsFooter } from "@/routes/_authenticated/_shell/business/navigation/SettingsFooter";
import type { Result } from "@/shared/utility/result";

const navPathMap: Record<NavId, string> = {
  ...Object.fromEntries(mainNavConfigs.map((c) => [c.id, c.path])),
  settings: footerNavConfig.path,
  utilities: utilityNavConfig.path,
} as Record<NavId, string>;

const pathNavMap: Record<string, NavId> = Object.fromEntries(
  Object.entries(navPathMap).map(([id, path]) => [path, id as NavId]),
);

export function AppSidebar(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const sysMailCache = useMailStore((s) => s.sysMailCache);
  const loginState = useAppStore((s) => s.loginState);
  const hasUnread = sysMailCache?.mails.some((m) => !m.isRead) ?? false;

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
    teamConfigs.find((team) => team.id === selectedTeamId) ?? teamConfigs[0];

  const activeNavId = pathNavMap[location.pathname] ?? "workspace";

  const handleNavSelect = (id: NavId): void => {
    void navigate({
      to: navPathMap[id] as
        | "/workspace"
        | "/comic-playground"
        | "/member-list"
        | "/system-mail"
        | "/settings"
        | "/utilities",
    });
  };

  const handleTeamSelect = (team: TeamConfig): void => {
    useAppStore.getState().setSelectedTeamId(team.id);
    setIsSelectingTeam(false);
  };

  const handleUpdateTeam = useCallback(
    async (
      id: string,
      args: { name: string; description?: string | undefined },
    ): Promise<Result<void>> => {
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
  const handleMouseLeave = (): void => {
    setIsHovered(false);
    if (isAvatarUploading) {
      return;
    }
    setIsSelectingTeam(false);
  };

  useEffect(() => {
    if (!isAvatarUploading && !isHovered && isSelectingTeam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect
      setIsSelectingTeam(false);
    }
  }, [isAvatarUploading, isHovered, isSelectingTeam]);

  return (
    <AppSidebarLayout
      isExpanded={isExpanded}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={handleMouseLeave}
      header={<TitleHeader />}
      teamOption={
        resolvedActiveTeam ? (
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
        ) : (
          <p className="px-3 py-2 text-xs text-muted-foreground">尚未加入团队</p>
        )
      }
      nav={
        <>
          {mainNavConfigs.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeNavId === item.id}
              onClick={() => {
                handleNavSelect(item.id);
              }}
              hasBadge={item.id === "system-mail" && hasUnread}
            />
          ))}
          <NavItem
            icon={utilityNavConfig.icon}
            label={utilityNavConfig.label}
            isActive={activeNavId === "utilities"}
            onClick={() => {
              handleNavSelect("utilities");
            }}
          />
        </>
      }
      footer={
        <SettingsFooter
          config={footerNavConfig}
          isActive={activeNavId === "settings"}
          onClick={() => {
            handleNavSelect("settings");
          }}
        />
      }
    />
  );
}
