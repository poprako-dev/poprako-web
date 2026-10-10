import { useRef, useState } from "react";
import type { JSX } from "react";
import { Upload, RotateCcw } from "lucide-react";
import type { PageArtwork } from "@/route/_authenticated/business/artwork/artwork";
import { useApiClient } from "@/route/business/api-context";
import { createArtworkBatch } from "../upload/artwork-batch";
import type { ArtworkBatch } from "../upload/artwork-batch-types";
import { useArtworkBatch } from "../upload/use-artwork-batch";
import { ARTWORK_PHASE_LABELS } from "../upload/artwork-batch-types";
type Props = {
  page: PageArtwork;
  issueCount?: number | undefined;
  canUpload: boolean;
  onOpen: (id: string) => void;
  onChanged: () => void;
};
export function ArtworkCard({
  page,
  issueCount,
  canUpload,
  onOpen,
  onChanged,
}: Props): JSX.Element {
  const client = useApiClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [batch, setBatch] = useState<ArtworkBatch | null>(null);
  const state = useArtworkBatch(batch);
  const [error, setError] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = page.imageThumbnailUrl ?? page.imageOptimizedUrl ?? page.imageUrl;
  const task = state.tasks[0];
  const message = error ?? state.error ?? task?.error;
  const active = state.running;
  return (
    <div className="group relative flex aspect-3/4 flex-col overflow-hidden rounded-sm border border-line-slate-100 bg-surface-white transition-all hover:border-line-slate-300 hover:shadow-sm">
      <button
        type="button"
        disabled={!page.imageUploaded || !page.imageUrl || active}
        onClick={() => {
          onOpen(page.id);
        }}
        aria-label={"查看第 " + String(page.index + 1) + " 页嵌稿"}
        className="relative h-full w-full disabled:cursor-default"
      >
        {url && failedUrl !== url && loadedUrl !== url && (
          <span role="status" className="absolute inset-0 animate-pulse bg-surface-slate-100">
            <span className="sr-only">正在加载预览</span>
          </span>
        )}
        {url && failedUrl !== url ? (
          <img
            src={url}
            alt={page.rawIdent ?? "成稿预览"}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            onLoad={() => {
              setLoadedUrl(url);
            }}
            onError={() => {
              setFailedUrl(url);
            }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-surface-slate-100 px-2 text-xs text-text-muted-cool">
            {url ? "预览加载失败" : "等待上传预览"}
          </span>
        )}
        <span className="absolute left-2 top-2 z-10 rounded bg-image-label-overlay px-1.5 py-1 text-[10px] font-bold leading-none text-image-label-foreground">
          P{page.index + 1}
        </span>
      </button>
      {issueCount !== undefined && issueCount > 0 && (
        <div
          aria-label={`第 ${String(page.index + 1)} 页有 issue`}
          className="pointer-events-none absolute top-2 right-2 z-10 flex items-center justify-center rounded bg-image-label-overlay px-1.5 py-1"
        >
          <div className="h-2.5 w-2.5 rounded-full bg-surface-orange-400 shadow-sm" />
        </div>
      )}
      {issueCount !== undefined && (
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 right-1.5 z-10 rounded bg-image-label-overlay px-2 py-1 text-center text-[10px] text-image-label-foreground">
          {issueCount} issue
        </div>
      )}
      {url && failedUrl === url && (
        <button
          type="button"
          aria-label="重新加载预览"
          className="absolute right-2 top-10 z-20 rounded-sm border border-line-slate-300 bg-surface-slate-50 p-1 text-text-muted-cool"
          onClick={() => {
            setFailedUrl(null);
            setLoadedUrl(null);
            onChanged();
          }}
        >
          <RotateCcw size={14} />
        </button>
      )}
      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".psd"
            className="hidden"
            aria-label={"重传第 " + String(page.index + 1) + " 页 PSD"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                setError(null);
                const next = createArtworkBatch({
                  client,
                  chapterId: page.chapterId,
                  files: [file],
                  includeArchive: false,
                  targetId: page.id,
                  onChanged,
                });
                setBatch(next);
                void next.run();
              } catch (error) {
                setError(error instanceof Error ? error.message : String(error));
              }
            }}
          />
          <button
            type="button"
            disabled={active}
            onClick={() => {
              inputRef.current?.click();
            }}
            aria-label={"重上传第 " + String(page.index + 1) + " 页嵌稿"}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-line-slate-300 bg-surface-slate-50 p-1 text-text-muted-cool opacity-100 transition-all hover:bg-surface-slate-100 focus-visible:opacity-100 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Upload size={14} />
          </button>
        </>
      )}
      {active && task && (
        <div
          role="status"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-image-label-overlay px-2 text-center text-xs text-image-label-foreground"
        >
          <span>
            {ARTWORK_PHASE_LABELS[task.phase]}
            {task.progress === null ? "" : " " + String(Math.floor(task.progress)) + "%"}
          </span>
          <button
            type="button"
            className="underline"
            onClick={() => {
              batch?.cancel();
            }}
          >
            停止上传
          </button>
        </div>
      )}
      {!active && message && (
        <div
          role="alert"
          className="absolute inset-x-1.5 bottom-1.5 z-20 rounded-sm bg-surface-rose-600 p-1.5 text-center text-[10px] text-ink-white"
        >
          <span title={message}>{message}</span>
          {batch && (
            <button
              type="button"
              className="ml-1 underline"
              onClick={() => {
                void batch.run();
              }}
            >
              重试
            </button>
          )}
        </div>
      )}
    </div>
  );
}
