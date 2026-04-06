import clsx from "clsx";

type Props = {
  icon: React.ElementType;
  label: string;
  value: number | string;
};

export default function StatItem({ icon: Icon, label, value }: Props) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between py-1.5",
        "border-b border-slate-50 last:border-none",
        "group shrink-0",
      )}
    >
      <div
        className={clsx(
          "flex items-center gap-2 text-slate-400",
          "group-hover:text-slate-600 transition-colors",
        )}
      >
        <Icon size={11} />
        <span className="text-[9px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-[11px] font-black text-slate-700 tracking-tight">
        {value}
      </span>
    </div>
  );
}
