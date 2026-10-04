import type { ReactNode } from "react";
import type { ReactElement } from "react";
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

export function AppSidebarLayout({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  header,
  teamOption,
  nav,
  footer,
}: Props): ReactElement {
  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <nav
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onMouseLeave();
      }}
      className={clsx(
        "fixed left-0 top-0 z-50",
        "hidden sm:flex h-screen flex-col",
        "bg-navigation-paper border-r border-line-stone-200",
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
