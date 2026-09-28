import type { JSX } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

type Props = { onClose: () => void };

export function AnnouncementDetailHeader({ onClose }: Props): JSX.Element {
  return (
    <div className="mb-5 flex items-start justify-between">
      <span
        className={clsx(
          "rounded bg-muted px-0 py-1 text-[10px] font-semibold italic text-muted-foreground",
          "tracking-wide",
        )}
      >
        ANNOUNCEMENT DETAIL
      </span>
      <button
        type="button"
        onClick={onClose}
        className={clsx(
          "rounded p-1 text-muted-foreground hover:bg-muted hover:text-text-secondary",
          "transition-colors focus:outline-none",
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
