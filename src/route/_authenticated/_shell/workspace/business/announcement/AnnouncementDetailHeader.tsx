import type { JSX } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

type Props = { onClose: () => void };

export function AnnouncementDetailHeader({ onClose }: Props): JSX.Element {
  return (
    <div className="flex justify-between items-start mb-5">
      <span
        className={clsx(
          "text-[10px] font-semibold text-text-muted-cool",
          "tracking-wide bg-surface-slate-50",
          "px-0 py-1 rounded italic",
        )}
      >
        ANNOUNCEMENT DETAIL
      </span>
      <button
        type="button"
        onClick={onClose}
        className={clsx(
          "p-1 rounded hover:bg-surface-slate-50",
          "text-text-muted-cool hover:text-ink-slate-600",
          "transition-colors focus:outline-none",
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
