import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSize } from "../../archive";
import { isKeyboardComposing } from "@/lib/keyboard";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Props = {
  files: File[];
  isBusy: boolean;
  onChange: (files: File[]) => void;
};

export default function ArchiveFileList({ files, isBusy, onChange }: Props) {
  const rowsRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(files.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  function commitPage(value: string, input: HTMLInputElement) {
    const requestedPage = Number(value);
    const nextPage = Number.isSafeInteger(requestedPage)
      ? Math.min(Math.max(requestedPage - 1, 0), pageCount - 1)
      : currentPage;
    setPageIndex(nextPage);
    input.value = String(nextPage + 1);
  }

  useEffect(() => {
    const element = rowsRef.current;
    if (!element) {return;}
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.height === 0) {return;}
      setPageSize(Math.max(1, Math.floor(entry.contentRect.height / 32)));
    });
    observer.observe(element);
    return () => { observer.disconnect(); };
  }, []);

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <div className={clsx(
        "mb-2 flex shrink-0 items-center justify-between",
        "text-xs text-muted-foreground",
      )}>
        <span>文件清单 · {files.length}</span>
        <div className="flex items-center gap-3">
          <span>{formatSize(totalSize)}</span>
          <Button
            type="button" variant="ghost" size="xs" disabled={isBusy}
            onClick={() => { onChange([]); }}
          >清空</Button>
        </div>
      </div>
      <div ref={rowsRef} className="min-h-0 flex-1">
        <ul className="divide-y divide-border">
          {files.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((file) => (
            <li key={file.name} className="flex h-[32px] items-center gap-3 text-sm">
              <File size={16} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate" title={file.name}>{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSize(file.size)}
              </span>
              <Button
                type="button" variant="ghost" size="icon-xs" disabled={isBusy}
                aria-label={`移除 ${file.name}`}
                onClick={() => { onChange(files.filter((item) => item !== file)); }}
              ><X size={14} /></Button>
            </li>
          ))}
        </ul>
      </div>
      <div
        className={clsx(
          "flex shrink-0 items-center justify-end gap-1 pt-2",
          "text-xs text-muted-foreground",
        )}
      >
        <Button
          type="button" variant="ghost" size="icon-xs" aria-label="上一页"
          disabled={currentPage === 0}
          onClick={() => { setPageIndex(currentPage - 1); }}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="flex h-7 items-center rounded-md bg-muted/50 px-1">
          <input
            key={currentPage}
            type="text"
            inputMode="numeric"
            defaultValue={currentPage + 1}
            aria-label="文件页码"
            onBlur={(event) => { commitPage(event.currentTarget.value, event.currentTarget); }}
            onKeyDown={(event) => {
              if (isKeyboardComposing(event.nativeEvent)) {return;}
              if (event.key === "Enter") {event.currentTarget.blur();}
            }}
            className={clsx(
              "h-7 w-9 appearance-none bg-transparent p-0 text-center text-xs",
              "font-semibold text-foreground outline-none",
            )}
          />
          <span className="pr-2 text-slate-300">/</span>
          <span className="min-w-5 pr-1 text-center">{pageCount}</span>
        </span>
        <Button
          type="button" variant="ghost" size="icon-xs" aria-label="下一页"
          disabled={currentPage === pageCount - 1}
          onClick={() => { setPageIndex(currentPage + 1); }}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
