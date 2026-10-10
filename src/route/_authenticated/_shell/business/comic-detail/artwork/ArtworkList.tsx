import { useState } from "react";
import type { JSX } from "react";
import { Plus, UploadCloud } from "lucide-react";
import clsx from "clsx";
import type { PageArtwork } from "@/route/_authenticated/business/artwork/artwork";
import { ArtworkCard } from "./ArtworkCard";
type Props = {
  pages: readonly PageArtwork[];
  issueCounts?: Record<string, number> | null;
  canUpload: boolean;
  onOpen: (id: string) => void;
  onUpload: (files: File[]) => void;
  onChanged: () => void;
};
export function ArtworkList({
  pages,
  issueCounts,
  canUpload,
  onOpen,
  onUpload,
  onChanged,
}: Props): JSX.Element {
  const [dragging, setDragging] = useState(false);
  return (
    <section
      aria-label="章节嵌稿"
      className="relative"
      onDragOverCapture={(event) => {
        if (canUpload) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeaveCapture={() => {
        setDragging(false);
      }}
      onDropCapture={(event) => {
        event.preventDefault();
        setDragging(false);
        if (canUpload) onUpload(Array.from(event.dataTransfer.files));
      }}
    >
      <div
        className={clsx(
          "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
          dragging && "pointer-events-none opacity-40",
        )}
      >
        {pages.map((page) => (
          <ArtworkCard
            key={page.id}
            page={page}
            issueCount={issueCounts ? (issueCounts[page.id] ?? 0) : undefined}
            canUpload={canUpload}
            onOpen={onOpen}
            onChanged={onChanged}
          />
        ))}
        {canUpload && (
          <button
            type="button"
            aria-label="上传嵌稿"
            onClick={() => {
              onUpload([]);
            }}
            className="flex aspect-3/4 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-line-slate-200 text-text-muted-cool transition-all hover:border-line-slate-300 hover:bg-surface-slate-50 active:scale-[0.98]"
          >
            <Plus className="h-7 w-7" strokeWidth={1.5} />
          </button>
        )}
      </div>
      {!canUpload && pages.length === 0 && (
        <p role="status" className="p-4 text-center text-sm text-text-muted-cool">
          当前章节尚未上传嵌稿
        </p>
      )}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-line-slate-400 bg-surface-white/80 backdrop-blur-sm">
          <UploadCloud className="h-8 w-8 text-icon-muted-cool" />
          <span className="text-xs font-bold text-ink-slate-500">松开以选择嵌稿</span>
        </div>
      )}
    </section>
  );
}
