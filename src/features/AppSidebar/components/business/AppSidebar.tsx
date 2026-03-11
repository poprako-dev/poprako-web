import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { NavId, TeamConfig } from "../../types/types";
import {
  mainNavConfigs,
  footerNavConfig,
  teamConfigs,
} from "../../config/config";
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

  const [isHovered, setIsHovered] = useState(false);
  const [isSelectingTeam, setIsSelectingTeam] = useState(false);

  const isExpanded = isHovered || isSelectingTeam;

  const [activeTeam, setActiveTeam] = useState(teamConfigs[0]);

  const activeNavId = pathNavMap[location.pathname] ?? "workspace";

  const handleNavSelect = (id: NavId) => {
    navigate(navPathMap[id]);
  };

  const handleTeamSelect = (team: TeamConfig) => {
    setActiveTeam(team);
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
          activeTeam={activeTeam}
          isListOpen={isSelectingTeam}
          onToggleList={() => setIsSelectingTeam((v) => !v)}
          onSelectTeam={handleTeamSelect}
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
