import type { ReactElement } from "react";
import type { NavConfig } from "@/routes/_authenticated/_shell/business/navigation/app-sidebar-type";
import { NavItem } from "@/routes/_authenticated/_shell/business/navigation/NavItem";

type Props = {
  config: NavConfig;
  isActive: boolean;
  onClick: () => void;
};

export function SettingsFooter({ config, isActive, onClick }: Props): ReactElement {
  return (
    <div className="py-2 border-t border-[#D9CDB4]">
      <NavItem icon={config.icon} label={config.label} isActive={isActive} onClick={onClick} />
    </div>
  );
}
