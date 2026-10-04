import { useState } from "react";
import clsx from "clsx";
import { FileArchive, Image as ImageIcon, Images } from "lucide-react";
import { Switch } from "radix-ui";
import type { ReactElement } from "react";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";

type Props = {
  open: boolean;
  onCancel: () => void;
  onExport: (options: { includeImages: boolean; withRawIdent: boolean }) => void;
};

export function ComicDetailExportOptionsDialog({
  open,
  onCancel,
  onExport,
}: Props): ReactElement | null {
  const [useRawImageNames, setUseRawImageNames] = useState(false);
  if (!open) return null;

  return (
    <ConfirmDialog mode="content" title="下载数据" onCancel={onCancel}>
      <div className="px-5 pb-5 pt-1">
        <div
          className={clsx(
            "mb-3 flex h-8 items-center gap-2 rounded-lg px-2",
            "text-xs font-medium text-text-muted-cool hover:bg-surface-slate-50",
          )}
        >
          <ImageIcon size={14} className="text-text-muted-cool" />
          <label htmlFor="export-raw-image-names" className="flex-1 cursor-pointer">
            使用原始图片名
          </label>
          <Switch.Root
            id="export-raw-image-names"
            checked={useRawImageNames}
            onCheckedChange={setUseRawImageNames}
            className={clsx(
              "relative h-4.5 w-8 rounded-full bg-surface-slate-200 transition-colors",
              "data-[state=checked]:bg-(--primary)",
            )}
          >
            <Switch.Thumb
              className={clsx(
                "block size-3.5 translate-x-0.5 rounded-full bg-surface-white shadow-sm",
                "transition-transform data-[state=checked]:translate-x-4",
              )}
            />
          </Switch.Root>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onExport({
                includeImages: false,
                withRawIdent: useRawImageNames,
              });
            }}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1 py-2",
              "rounded-lg text-xs font-semibold",
              "transition-all duration-200 active:scale-[0.98]",
              "border border-line-slate-100 bg-surface-slate-50 text-text-muted-cool",
              "hover:bg-surface-slate-100",
            )}
          >
            <FileArchive size={14} />
            仅翻校数据
          </button>
          <button
            type="button"
            onClick={() => {
              onExport({
                includeImages: true,
                withRawIdent: useRawImageNames,
              });
            }}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1 py-2",
              "rounded-lg text-xs font-semibold",
              "transition-all duration-200 active:scale-[0.98]",
              "border border-line-green-200 bg-surface-green-50 text-text-green",
              "hover:bg-surface-green-100",
            )}
          >
            <Images size={14} />
            包含图源
          </button>
        </div>
      </div>
    </ConfirmDialog>
  );
}
