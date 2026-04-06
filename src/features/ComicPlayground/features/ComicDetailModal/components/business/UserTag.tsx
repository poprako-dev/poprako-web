import clsx from "clsx";
import { Trash2 } from "lucide-react";

type Props = {
  name: string;
  userId: string;
  onRemove?: (userId: string) => void;
};

export default function UserTag({ name, userId, onRemove }: Props) {
  return (
    <div
      className={clsx(
        "group/tag relative flex items-center gap-1",
        "bg-white/70 border border-slate-100",
        "rounded-sm px-1.5 py-0.5",
        "text-[10px] font-semibold text-slate-600",
        "transition-all duration-150",
        onRemove && "hover:border-slate-300 hover:pr-4",
      )}
    >
      <span className="leading-none">{name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(userId);
          }}
          className={clsx(
            "absolute right-0.5 top-1/2 -translate-y-1/2",
            "opacity-0 group-hover/tag:opacity-100",
            "transition-opacity duration-150",
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
