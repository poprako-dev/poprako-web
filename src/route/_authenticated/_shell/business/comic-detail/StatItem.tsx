import type { JSX } from "react";
import clsx from "clsx";

type Props = {
  icon: React.ElementType;
  label: string;
  value: number | string;
};

export function StatItem({ icon: Icon, label, value }: Props): JSX.Element {
  return (
    <div
      className={clsx(
        "flex items-center justify-between py-1.5",
        "border-b border-line-stone-200 last:border-none",
        "group shrink-0",
      )}
    >
      <div
        className={clsx(
          "flex items-center gap-2 text-text-muted-warm",
          "group-hover:text-ink-stone-600 transition-colors",
        )}
      >
        <Icon size={11} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-[11px] font-black text-ink-stone-700 tracking-tight">{value}</span>
    </div>
  );
}
