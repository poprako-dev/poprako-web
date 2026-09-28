import { type JSX, useRef, useState } from "react";
import clsx from "clsx";
import { FilePlus2 } from "lucide-react";
import type { ArchiveMode } from "@/route/_authenticated/_shell/(utility)/business/archive";
import { useArchiveTool } from "@/route/_authenticated/_shell/(utility)/business/use-archive-tool";
import { ArchiveFileList } from "@/route/_authenticated/_shell/(utility)/business/ArchiveFileList";
import { ArchiveOutput } from "@/route/_authenticated/_shell/(utility)/business/ArchiveOutput";
type Props = { mode: ArchiveMode };

export function ArchiveTool({ mode }: Props): JSX.Element {
  const tool = useArchiveTool(mode);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasFiles = tool.files.length > 0;
  const isCompress = mode === "compress";
  const isBusy = tool.phase === "busy";

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col"
      aria-labelledby={`${mode}-title`}
      aria-busy={isBusy}
    >
      <h3 id={`${mode}-title`} className="mb-3 shrink-0 text-lg font-semibold">
        {isCompress ? "打包并压缩嵌稿" : "解压并解包嵌稿"}
      </h3>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        aria-label="选择嵌稿文件"
        multiple={isCompress}
        accept={isCompress ? undefined : ".tar.xz"}
        disabled={isBusy}
        onChange={(event) => {
          tool.addFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={isBusy}
        onClick={() => {
          inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          tool.addFiles([...event.dataTransfer.files]);
        }}
        className={clsx(
          "flex w-full items-center justify-center gap-3 rounded-lg border border-dashed",
          "px-4 transition-colors disabled:opacity-50",
          hasFiles ? "h-10 shrink-0" : "min-h-0 flex-1 flex-col",
          "focus-visible:outline-2 focus-visible:outline-ring",
          isDragging
            ? "border-primary-border bg-primary-subtle"
            : "border-input bg-muted/30 hover:border-primary-border hover:bg-muted/50",
        )}
      >
        <FilePlus2 size={hasFiles ? 18 : 32} strokeWidth={1.4} className="text-primary-text" />
        <span className="text-sm font-medium">
          {hasFiles ? (isCompress ? "添加文件" : "重新选择文件") : "选择或拖入文件"}
        </span>
        <span className={clsx("text-xs text-muted-foreground", hasFiles && "hidden sm:inline")}>
          {isCompress ? "多个文件 → TAR.XZ" : "TAR.XZ → ZIP"}
        </span>
      </button>
      <p className="mt-2 shrink-0 text-xs text-muted-foreground">
        {isCompress ? "最多 1,000 个文件 · 合计 8 GiB" : "解包后最多 1,000 项 · 合计 8 GiB"}
      </p>
      {hasFiles && (
        <>
          <ArchiveFileList files={tool.files} isBusy={isBusy} onChange={tool.updateFiles} />
          <ArchiveOutput tool={tool} isCompress={isCompress} />
        </>
      )}
    </section>
  );
}
