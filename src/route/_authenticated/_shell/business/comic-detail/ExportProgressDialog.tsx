import type { JSX } from "react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { AppDialog } from "@/shared/component/AppDialog";

type Props = {
  open: boolean;
  title: string;
  description: string;
  progress: number;
  onCancel: () => void;
};

export function ExportProgressDialog({
  open,
  title,
  description,
  progress,
  onCancel,
}: Props): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <AppDialog title={title} description={description} onClose={onCancel} closeOnBackdrop={false}>
      <div className="flex items-center gap-3">
        <LoadingCircle
          size={20}
          className="inline-flex shrink-0 animate-spin text-ink-green-500"
          aria-label="exporting"
        />
        <div className="min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-surface-green-50">
            <div
              className={clsx(
                "h-full rounded-full bg-(--brand-leaf)",
                "transition-[width] duration-200",
              )}
              style={{ width: `${String(Math.max(0, Math.min(progress, 100)))}%` }}
            />
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
