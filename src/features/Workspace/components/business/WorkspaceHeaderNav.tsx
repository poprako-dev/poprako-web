import { LayoutDashboard, Sigma } from "lucide-react";
import clsx from "clsx";
import type { WorkspaceTab } from "../../types/types";

type Props = {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
};

const navItems: {
  id: WorkspaceTab;
  icon: typeof LayoutDashboard;
  label: string;
}[] = [
  { id: "workspace", icon: LayoutDashboard, label: "工作台" },
  { id: "symbols", icon: Sigma, label: "特殊符号" },
];

export default function WorkspaceHeaderNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className={clsx(
        "h-10 border-b border-slate-100 bg-[#FEFDF9]/80 px-4 sm:px-6",
        "backdrop-blur-md",
      )}
    >
      <div className={clsx("flex h-full w-full items-stretch justify-center")}>
        <div
          className={clsx(
            "flex h-full max-w-full items-stretch gap-1 overflow-x-auto",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={clsx(
                "group relative flex h-full shrink-0 items-center gap-2 px-3",
                "transition-colors",
                activeTab === item.id
                  ? "text-slate-600 bg-green-50/80"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <item.icon
                size={18}
                strokeWidth={activeTab === item.id ? 2.4 : 2}
              />
              <span
                className={clsx("text-[12px] font-semibold tracking-tight")}
              >
                {item.label}
              </span>
              {activeTab === item.id && (
                <span
                  className={clsx(
                    "absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full",
                    "bg-green-500/80",
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
