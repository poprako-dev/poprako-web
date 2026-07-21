import { useRef, useState } from "react";
import clsx from "clsx";
import { Plus, UploadCloud } from "lucide-react";
import type { PageInfo } from "@/types";
import PageCard from "./PageCard";

type Props = {
  pages: PageInfo[];
  onClickPage?: (pageId: string) => void;
  onDeletePage?: (pageId: string) => void;
  onReuploadPage?: (pageId: string, file: File) => void;
  canReuploadPage?: (page: PageInfo) => boolean;
  isPageReuploading?: (pageId: string) => boolean;
  enableDelete?: boolean;
  enableClick?: boolean;
  /** 当提供时，区域支持拖放批量上传，文件按 Windows 自然排序顺序排列 */
  onAddPages?: (files: File[]) => Promise<void>;
  accept?: string;
  reuploadAccept?: string;
  uploadProgressByPageId?: Record<string, number>;
};

function naturalSort(files: FileList): File[] {
  return Array.from(files).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

// PageCard extracted to its own file: ./PageCard

export default function PageList({
  pages,
  onClickPage,
  onDeletePage,
  onReuploadPage,
  canReuploadPage,
  isPageReuploading,
  enableDelete,
  enableClick = true,
  onAddPages,
  accept,
  reuploadAccept,
  uploadProgressByPageId,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onAddPages) return;
    const sorted = naturalSort(files);
    setIsUploading(true);
    try {
      await onAddPages(sorted);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="relative"
      onDragOver={(e) => {
        if (!onAddPages) return;
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      {/* {onAddPages && !isDragging && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border",
              "border-slate-200 bg-white text-slate-500",
              "hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50",
              "text-[11px] font-bold transition-all",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isUploading ? "上传中..." : "上传图片"}</span>
          </button>
        </div>
      )} */}

      {/* Page grid */}
      <div
        className={clsx(
          "grid gap-3",
          "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
          isDragging && "opacity-40 pointer-events-none",
        )}
      >
        {pages.map((page) => (
          <PageCard
            key={page.id}
            page={page}
            onClick={onClickPage ? () => onClickPage(page.id) : undefined}
            onDelete={onDeletePage ? () => onDeletePage(page.id) : undefined}
            enableDelete={enableDelete}
            enableClick={enableClick}
            canReupload={canReuploadPage ? canReuploadPage(page) : false}
            isReuploading={
              isPageReuploading ? isPageReuploading(page.id) : false
            }
            onReupload={
              onReuploadPage
                ? (file) => onReuploadPage(page.id, file)
                : undefined
            }
            reuploadAccept={reuploadAccept}
            uploadProgress={uploadProgressByPageId?.[page.id]}
          />
        ))}
        {onAddPages && !isUploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={clsx(
              "aspect-3/4 rounded-sm border border-dashed border-slate-200",
              "flex flex-col items-center justify-center gap-2",
              "text-slate-300 hover:text-slate-500 hover:border-slate-300 hover:bg-slate-50",
              "transition-all active:scale-[0.98]",
            )}
            aria-label="追加页面图片"
          >
            <Plus className="h-7 w-7" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Drop overlay */}
      {onAddPages && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept ?? "image/*"}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {isDragging && (
            <div
              className={clsx(
                "absolute inset-0 z-20 flex flex-col items-center justify-center gap-2",
                "rounded-sm border-2 border-dashed border-slate-400 bg-white/80 backdrop-blur-sm",
              )}
            >
              <UploadCloud className="w-8 h-8 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">
                松开以批量上传
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
