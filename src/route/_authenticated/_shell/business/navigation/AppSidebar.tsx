import { type ReactElement, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import type {
  NavId,
  TeamConfig,
} from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";
import {
  footerNavConfig,
  mainNavConfigs,
  utilityNavConfig,
} from "@/route/_authenticated/_shell/business/navigation/navigation-config";
import { useAppStore } from "@/route/business/session/session-store";
import { useMailStore } from "@/route/_authenticated/_shell/business/mail/mail-store";
import { updateTeam } from "@/api/identity/identity-api";
import { hasRole } from "@/route/business/identity/role";
import { useTeamConfigs } from "@/route/_authenticated/_shell/business/navigation/use-team-configs";
import { AppSidebarLayout } from "@/route/_authenticated/_shell/business/navigation/AppSidebarLayout";
import { TitleHeader } from "@/route/_authenticated/_shell/business/navigation/TitleHeader";
import { TeamOption } from "@/route/_authenticated/_shell/business/navigation/TeamOption";
import { NavItem } from "@/route/_authenticated/_shell/business/navigation/NavItem";
import { SettingsFooter } from "@/route/_authenticated/_shell/business/navigation/SettingsFooter";
import type { Result } from "@/shared/utility/result";

import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";

const navPathMap: Record<NavId, string> = {
  ...Object.fromEntries(mainNavConfigs.map((c) => [c.id, c.path])),
  settings: footerNavConfig.path,
  utilities: utilityNavConfig.path,
} as Record<NavId, string>;

const pathNavMap: Record<string, NavId> = Object.fromEntries(
  Object.entries(navPathMap).map(([id, path]) => [path, id as NavId]),
);

function navigateToSidebarNav(id: NavId, navigate: ReturnType<typeof useNavigate>): void {
  void navigate({
    to: navPathMap[id] as
      | "/workspace"
      | "/comic-playground"
      | "/member-list"
      | "/system-mail"
      | "/settings"
      | "/utilities",
  });
}

async function updateSidebarTeam(
  client: ReturnType<typeof useApiClient>,
  refreshTeams: () => Promise<void>,
  id: string,
  args: { name: string; description?: string | undefined },
): Promise<Result<void>> {
  const result = await updateTeam(client, id, args);
  if (!result.success) {
    console.error("[AppSidebar] 更新汉化组信息失败:", result.error);
    return result;
  }
  await refreshTeams();
  return result;
}

function selectSidebarTeam(team: TeamConfig, setSelectingTeam: (selected: boolean) => void): void {
  useAppStore.getState().setSelectedTeamId(team.id);
  setSelectingTeam(false);
}

function leaveSidebar(
  isAvatarUploading: boolean,
  setHovered: (hovered: boolean) => void,
  setSelectingTeam: (selecting: boolean) => void,
): void {
  setHovered(false);
  if (!isAvatarUploading) {
    setSelectingTeam(false);
  }
}

export function AppSidebar(): ReactElement {
  const client = useApiClient();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const sysMails = useMailStore((s) => s.mails);
  const loginState = useReadySession();
  const hasUnread = sysMails.some((mail) => !mail.isRead);

  const isTeamAdmin = useMemo(() => {
    const member = loginState.memberInfos.find((m) => m.teamId === selectedTeamId);
    return member !== undefined && hasRole(member, "admin");
  }, [loginState.memberInfos, selectedTeamId]);

  const [isHovered, setIsHovered] = useState(false);
  const [isSelectingTeam, setIsSelectingTeam] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const isExpanded = isHovered || isSelectingTeam;

  const { teamConfigs, refreshTeams } = useTeamConfigs();

  const resolvedActiveTeam =
    teamConfigs.find((team) => team.id === selectedTeamId) ?? teamConfigs[0];

  const activeNavId = pathNavMap[location.pathname] ?? "workspace";

  const handleNavSelect = (id: NavId): void => {
    navigateToSidebarNav(id, navigate);
  };

  const handleUpdateTeam = useCallback(
    async (
      id: string,
      args: { name: string; description?: string | undefined },
    ): Promise<Result<void>> => {
      return updateSidebarTeam(client, refreshTeams, id, args);
    },
    [client, refreshTeams],
  );
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
      onMouseLeave={() => {
        leaveSidebar(isAvatarUploading, setIsHovered, setIsSelectingTeam);
      }}
      header={<TitleHeader />}
      teamOption={
        resolvedActiveTeam ? (
          <TeamOption
            key={resolvedActiveTeam.id}
            teams={teamConfigs}
            activeTeam={resolvedActiveTeam}
            isListOpen={isSelectingTeam}
            onToggleList={setIsSelectingTeam}
            onSelectTeam={(team) => {
              selectSidebarTeam(team, setIsSelectingTeam);
            }}
            onJoinTeam={refreshTeams}
            onUpdateTeam={isTeamAdmin ? handleUpdateTeam : undefined}
            onAvatarUploadingChange={setIsAvatarUploading}
          />
        ) : (
          <p className="px-3 py-2 text-xs text-navigation-muted">尚未加入团队</p>
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
