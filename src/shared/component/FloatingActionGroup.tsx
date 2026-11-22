import type { JSX, ReactNode } from "react";
import clsx from "clsx";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function FloatingActionGroup({ label, children, className }: Props): JSX.Element {
  return (
    <div
      role="group"
      aria-label={label}
      className={clsx(
        "flex h-8 items-stretch overflow-hidden",
        "divide-x divide-line-gray-100 rounded-sm",
        "bg-surface-white/95 text-ink-gray-600 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
