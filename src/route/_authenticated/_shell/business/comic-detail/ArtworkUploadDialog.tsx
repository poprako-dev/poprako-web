import { useState } from "react";
import type { JSX } from "react";
import { FileArchive, FileStack, FileUp, X, Check, RotateCcw, CloudUpload } from "lucide-react";
import { Switch } from "radix-ui";
import { FilePicker } from "@/shared/component/FilePicker";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { useApiClient } from "@/route/business/api-context";
import { compareArtworkNames } from "@/route/_authenticated/business/artwork/artwork";
import { createArtworkBatch } from "./upload/artwork-batch";
import { useArtworkBatch } from "./upload/use-artwork-batch";
import type { ArtworkBatch } from "./upload/artwork-batch-types";
import { validateArtworkFiles } from "./upload/artwork-upload";
import { ArtworkTaskList } from "./ArtworkTaskList";
const EMPTY_FILES: File[] = [];
type Props = {
  chapterId: string;
  chapterLabel: string;
  onUploaded: () => void;
  onPagesChanged: () => void;
  onClose: () => void;
  canArchive?: boolean;
  initialFiles?: File[];
};
export function ArtworkUploadDialog({
  chapterId,
  chapterLabel,
  onUploaded,
  onPagesChanged,
  onClose,
  canArchive = true,
  initialFiles = EMPTY_FILES,
}: Props): JSX.Element {
  const client = useApiClient();
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [includeArchive, setIncludeArchive] = useState(canArchive);
  const [batch, setBatch] = useState<ArtworkBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const state = useArtworkBatch(batch);
  const done = state.tasks.length > 0 && state.tasks.every((task) => task.phase === "done");
  function choose(selected: File[]): void {
    try {
      validateArtworkFiles(selected);
      if (selected.some((file) => !/\.psd$/iu.test(file.name)))
        throw new Error("请选择 PSD 文件，系统会自动生成在线预览。");
      setBatch(null);
      setFiles([...selected].sort((a, b) => compareArtworkNames(a.name, b.name)));
      setError(null);
    } catch (error) {
      setBatch(null);
      setFiles([]);
      setError(error instanceof Error ? error.message : String(error));
    }
  }
  function start(): void {
    try {
      setError(null);
      const next =
        batch ??
        createArtworkBatch({
          client,
          chapterId,
          files,
          includeArchive: canArchive && includeArchive,
          onChanged: onPagesChanged,
          onCompleted: onUploaded,
        });
      setBatch(next);
      void next.run();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  }
  return (
    <AppDialog
      title="上传嵌稿"
      description={chapterLabel}
      onClose={onClose}
      locked={state.running}
      showClose={!state.running}
      closeOnBackdrop={false}
      bodyClassName="flex max-h-[55dvh] flex-col"
      footer={
        <div className="flex gap-2">
          {state.running ? (
            <AppDialogAction
              onClick={() => {
                batch?.cancel();
              }}
            >
              <X size={14} />
              停止
            </AppDialogAction>
          ) : done ? (
            <AppDialogAction tone="brand" onClick={onClose}>
              <Check size={14} />
              完成
            </AppDialogAction>
          ) : (
            <>
              <AppDialogAction onClick={onClose}>关闭</AppDialogAction>
              <AppDialogAction tone="brand" disabled={files.length === 0} onClick={start}>
                {batch ? <RotateCcw size={14} /> : <CloudUpload size={14} />}
                {batch ? "重试" : "上传"}
              </AppDialogAction>
            </>
          )}
        </div>
      }
    >
      <FilePicker
        inputLabel="选择嵌稿文件"
        buttonLabel={files.length ? "重新选择嵌稿" : "选择嵌稿"}
        accept=".psd"
        multiple
        disabled={state.running || done}
        invalid={error !== null}
        onSelect={choose}
      >
        {files.length ? <FileStack size={22} /> : <FileUp size={22} />}
        <span className="text-left text-sm">
          <span className="block font-semibold">
            {files.length ? String(files.length) + " 个 PSD" : "选择或拖入 PSD"}
          </span>
        </span>
      </FilePicker>
      <div className="mt-3 flex h-8 shrink-0 items-center gap-2 rounded-lg px-2 text-xs font-medium text-text-muted-cool hover:bg-surface-slate-50">
        <FileArchive size={14} className="text-icon-muted-cool" />
        <label htmlFor="artwork-package" className="flex-1 cursor-pointer">
          打包上传
        </label>
        <Switch.Root
          id="artwork-package"
          checked={includeArchive}
          disabled={!canArchive || state.running || batch !== null}
          title={!canArchive ? "需要嵌字、修图或管理员权限" : undefined}
          onCheckedChange={setIncludeArchive}
          className="relative h-4.5 w-8 rounded-full bg-surface-slate-200 transition-colors data-[state=checked]:bg-(--primary) disabled:opacity-50"
        >
          <Switch.Thumb className="block size-3.5 translate-x-0.5 rounded-full bg-surface-white shadow-sm transition-transform data-[state=checked]:translate-x-4" />
        </Switch.Root>
      </div>
      {batch && <ArtworkTaskList tasks={state.tasks} />}
      {(error ?? state.error) && (
        <p role="alert" className="mt-3 whitespace-pre-wrap text-sm text-text-danger">
          {error ?? state.error}
        </p>
      )}
    </AppDialog>
  );
}
