import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  header: ReactNode;
  teamOption: ReactNode;
  nav: ReactNode;
  footer: ReactNode;
};

export default function AppSidebarLayout({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  header,
  teamOption,
  nav,
  footer,
}: Props) {
  return (
    <nav
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={clsx(
        "fixed left-0 top-0 z-50",
        "hidden sm:flex h-screen flex-col",
        "bg-[#F2EFE8] border-r border-stone-200",
        "transition-[width] duration-400 ease-in-out",
        "group",
        isExpanded ? "w-56 shadow-xl" : "w-14.5",
      )}
    >
      {header}

      <div className="mb-1">{teamOption}</div>

      <div className="flex-1 space-y-1">{nav}</div>

      {footer}
    </nav>
  );
}
