import type { NavConfig } from "../../types/types";
import NavItem from "./NavItem";

type Props = {
  config: NavConfig;
  isActive: boolean;
  onClick: () => void;
};

export default function SettingsFooter({ config, isActive, onClick }: Props) {
  return (
    <div className="py-2 border-t border-[#D9CDB4]">
      <NavItem
        icon={config.icon}
        label={config.label}
        isActive={isActive}
        onClick={onClick}
      />
    </div>
  );
}
