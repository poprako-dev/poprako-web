import { type JSX, useEffect, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  CloudUpload,
  FileStack,
  FileUp,
  LoaderCircle,
  RotateCcw,
  X,
} from "lucide-react";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { toApiRequestError } from "@/route/business/request-error";
import { allocArtwork, markArtworkUploaded } from "@/api/chapter/artwork-api";
import { useApiClient } from "@/route/business/api-context";
import {
  prepareArtwork,
  validateArtworkFiles,
  type PreparedArtwork,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/artwork-upload";

type Props = {
  chapterId: string;
  chapterLabel: string;
  onUploaded: () => void;
  onClose: () => void;
};

type Phase = "ready" | "compress" | "upload" | "confirm" | "done" | "error" | "cancelled";

function formatSize(bytes: number): string {
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
}

export function ArtworkUploadDialog({
  chapterId,
  chapterLabel,
  onUploaded,
  onClose,
}: Props): JSX.Element {
  const [files, setFiles] = useState<File[]>([]);
  const client = useApiClient();
  const [phase, setPhase] = useState<Phase>("ready");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const preparedRef = useRef<PreparedArtwork | null>(null);
  const uploadedVersionRef = useRef<number | null>(null);
  const { showToast } = useToastStore();
  const isBusy = ["compress", "upload", "confirm"].includes(phase);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      void preparedRef.current?.dispose().catch((error: unknown) => {
        console.error("清理嵌稿临时文件失败", error);
      });
    };
  }, []);

  async function start(): Promise<void> {
    if (controllerRef.current || files.length === 0) {
      return;
    }
    const abort = new AbortController();
    controllerRef.current = abort;
    try {
      if (!preparedRef.current) {
        setPhase("compress");
        setProgress(0);
        const archive = await prepareArtwork(files, abort.signal, (value) => {
          const ratio = value.processedBytes / Math.max(totalSize, 1);
          setProgress(Math.min(45, ratio * 45));
        });
        if (abort.signal.aborted) {
          await archive.dispose();
          abort.signal.throwIfAborted();
        }
        preparedRef.current = archive;
      }
      const archive = preparedRef.current;
      if (uploadedVersionRef.current === null) {
        setPhase("upload");
        setProgress(50);
        const allocation = await allocArtwork(client, chapterId, archive.hash, archive.file.size);
        abort.signal.throwIfAborted();
        if (!allocation.success) {
          throw toApiRequestError(allocation);
        }
        if (allocation.data.slot) {
          const result = await client.putPresigned({
            url: allocation.data.slot.putUrl,
            file: archive.file,
            headers: allocation.data.slot.headers,
            onProgress: (value) => {
              setProgress(50 + value * 0.48);
            },
            signal: abort.signal,
          });
          abort.signal.throwIfAborted();
          if (!result.success) {
            throw toApiRequestError(result);
          }
        }
        uploadedVersionRef.current = allocation.data.artworkVersion;
      }
      abort.signal.throwIfAborted();
      setPhase("confirm");
      setProgress(98);
      const confirmation = await markArtworkUploaded(client, chapterId, uploadedVersionRef.current);
      if (!confirmation.success) {
        throw toApiRequestError(confirmation);
      }
      setProgress(100);
      setPhase("done");
      showToast("嵌稿上传成功", "success");
      onUploaded();
    } catch (error) {
      if (abort.signal.aborted) {
        setPhase("cancelled");
      } else {
        console.error("嵌稿上传失败", error);
        setPhase("error");
        showToast("嵌稿上传失败，请重试", "error");
      }
    } finally {
      controllerRef.current = null;
    }
  }

  function selectFiles(): void {
    inputRef.current?.click();
  }

  function cancel(): void {
    controllerRef.current?.abort();
  }

  const canSelect = !isBusy && phase !== "done";
  const isRetrying = phase === "error" || phase === "cancelled";

  return (
    <AppDialog
      title="上传嵌稿"
      description={chapterLabel}
      size="default"
      onClose={onClose}
      locked={isBusy}
      showClose={!isBusy}
      closeOnBackdrop={false}
      footer={
        <div className="flex gap-2">
          {isBusy && (
            <AppDialogAction onClick={cancel} disabled={phase === "confirm"}>
              <X size={14} />
              取消
            </AppDialogAction>
          )}
          {!isBusy && phase === "done" && (
            <AppDialogAction tone="brand" onClick={onClose}>
              <Check size={14} />
              完成
            </AppDialogAction>
          )}
          {!isBusy && phase !== "done" && (
            <>
              <AppDialogAction onClick={onClose}>
                <X size={14} />
                关闭
              </AppDialogAction>
              <AppDialogAction
                tone="brand"
                disabled={files.length === 0}
                onClick={() => {
                  void start();
                }}
              >
                {isRetrying ? <RotateCcw size={14} /> : <CloudUpload size={14} />}
                {isRetrying ? "重试" : "上传"}
              </AppDialogAction>
            </>
          )}
        </div>
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="选择嵌稿"
        onChange={(event) => {
          const selected = [...(event.target.files ?? [])];
          event.target.value = "";
          if (selected.length === 0) {
            return;
          }
          try {
            validateArtworkFiles(selected);
            const previous = preparedRef.current;
            preparedRef.current = null;
            uploadedVersionRef.current = null;
            void previous?.dispose().catch((error: unknown) => {
              console.error("清理嵌稿临时文件失败", error);
            });
            setFiles(selected);
            setProgress(0);
            setPhase("ready");
          } catch (error) {
            const message = error instanceof Error ? error.message : "文件选择无效";
            showToast(message, "error");
          }
        }}
      />

      <button
        type="button"
        onClick={selectFiles}
        disabled={!canSelect}
        aria-label={files.length > 0 ? "重新选择嵌稿" : "选择嵌稿"}
        className={clsx(
          "flex min-h-24 w-full items-center justify-center gap-3 rounded-lg",
          "border border-dashed transition-colors",
          isRetrying
            ? "border-(--danger-border) bg-surface-red-50 text-text-danger"
            : "border-line-stone-200 bg-surface-stone-50/60 text-text-muted-cool",
          canSelect && "hover:border-(--brand-leaf-border) hover:bg-surface-green-50",
          !canSelect && "cursor-default",
        )}
      >
        {isBusy && <LoaderCircle size={22} className="animate-spin text-ink-green-500" />}
        {!isBusy && isRetrying && <CircleAlert size={22} />}
        {!isBusy && !isRetrying && files.length > 0 && <FileStack size={22} />}
        {!isBusy && !isRetrying && files.length === 0 && <FileUp size={22} />}
        {files.length > 0 && !isBusy && (
          <span className="text-xs font-semibold tabular-nums">
            {files.length} · {formatSize(totalSize)}
          </span>
        )}
      </button>

      {isBusy && (
        <div className="mt-4 flex items-center gap-3">
          <CloudUpload size={15} className="shrink-0 text-ink-green-500" />
          <div
            role="progressbar"
            aria-label="上传进度"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-green-50"
          >
            <div
              className="h-full rounded-full bg-(--brand-leaf) transition-[width]"
              style={{ width: `${String(progress)}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-text-muted-cool">
            {Math.round(progress)}%
          </span>
        </div>
      )}

      {phase === "done" && (
        <span className="sr-only" role="status">
          上传完成
        </span>
      )}
    </AppDialog>
  );
}
