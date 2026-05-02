import clsx from "clsx";
import { Trash2 } from "lucide-react";

type Props = {
  name: string;
  userId: string;
  onRemove?: (userId: string) => void;
};

export default function UserTag({ name, userId, onRemove }: Props) {
  const displayName = name.length > 10 ? name.slice(0, 10) + "…" : name;

  return (
    <div
      title={name}
      className={clsx(
        "relative flex items-center gap-1",
        "bg-white/70 border border-slate-100",
        "rounded-sm py-0.5",
        "text-[10px] font-semibold text-slate-600",
        "transition-colors duration-150",
        onRemove ? "pl-1.5 pr-4 hover:border-slate-300" : "px-1.5",
      )}
    >
      <span className="leading-none">{displayName}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(userId);
          }}
          className={clsx(
            "absolute right-0.5 top-1/2 -translate-y-1/2",
            "text-slate-400 hover:text-red-400",
            "p-0",
          )}
          title={`移除 ${name}`}
        >
          <Trash2 size={9} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
