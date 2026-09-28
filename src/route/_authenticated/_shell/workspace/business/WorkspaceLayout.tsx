import type { JSX, ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
};

export function WorkspaceLayout({ children }: Props): JSX.Element {
  return (
    <div
      className={clsx("flex h-full w-full min-w-0 flex-col overflow-x-hidden bg-surface-workspace")}
    >
      <div
        className={clsx(
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
          "px-4 py-4 sm:px-6 sm:py-6",
        )}
      >
        {children}
      </div>
    </div>
  );
}
