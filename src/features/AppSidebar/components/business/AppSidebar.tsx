import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { NavId, TeamConfig } from "../../types/types";
import { mainNavConfigs, footerNavConfig } from "../../config/config";
import { useAppStore } from "@/store/app";
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

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const setSelectedTeamId = useAppStore((s) => s.setSelectedTeamId);

  const [isHovered, setIsHovered] = useState(false);
  const [isSelectingTeam, setIsSelectingTeam] = useState(false);

  const isExpanded = isHovered || isSelectingTeam;

  const { teamConfigs, refreshTeams } = useTeamConfigs();

  const resolvedActiveTeam =
    teamConfigs.find((team) => team.id === selectedTeamId) ??
    teamConfigs[0] ?? { id: "", name: "", short: "", desc: "" };

  const activeNavId = pathNavMap[location.pathname] ?? "workspace";

  const handleNavSelect = (id: NavId) => {
    navigate(navPathMap[id]);
  };

  const handleTeamSelect = (team: TeamConfig) => {
    setSelectedTeamId(team.id);
    setIsSelectingTeam(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsSelectingTeam(false);
  };

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
          onToggleList={() => setIsSelectingTeam((v) => !v)}
          onSelectTeam={handleTeamSelect}
          onJoinTeam={refreshTeams}
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
