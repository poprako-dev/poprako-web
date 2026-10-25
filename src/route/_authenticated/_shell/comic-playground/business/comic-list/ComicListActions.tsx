import type { ReactElement } from "react";
import { CirclePlus, FolderDown, Layers } from "lucide-react";
import clsx from "clsx";

type Props = {
  onCreateComic?: (() => void) | undefined;
  onExportArchives?: (() => void) | undefined;
  onToggleSidebar?: (() => void) | undefined;
};

export function ComicListActions({
  onCreateComic,
  onExportArchives,
  onToggleSidebar,
}: Props): ReactElement {
  return (
    <>
      {onCreateComic && (
        <button
          type="button"
          onClick={onCreateComic}
          title="创建漫画"
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
            "border border-line-slate-200 bg-surface-white text-text-muted-cool",
            "hover:border-line-slate-300 hover:shadow-sm hover:bg-surface-gray-100",
            "focus-visible:outline-none",
          )}
        >
          <CirclePlus className="h-5 w-5" strokeWidth={2} />
        </button>
      )}

      {onExportArchives && (
        <button
          type="button"
          onClick={onExportArchives}
          title="导出归档"
          aria-label="导出归档"
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
            "border border-line-slate-200 bg-surface-white text-text-muted-cool",
            "hover:border-line-slate-300 hover:shadow-sm hover:bg-surface-gray-100",
          )}
        >
          <FolderDown className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          title="切换工作区侧边栏"
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center",
            "justify-center rounded-lg transition-all",
            "border border-line-slate-200 bg-surface-white",
            "text-text-muted-cool",
            "hover:border-line-slate-300",
            "hover:shadow-sm hover:bg-surface-gray-100",
          )}
        >
          <Layers className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
    </>
  );
}
