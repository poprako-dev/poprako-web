import { type JSX, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, Download, LoaderCircle, Settings2 } from "lucide-react";
import { AppDialogAction } from "@/shared/component/AppDialog";
import { Button } from "@/shared/component/Button";
import { formatSize } from "@/route/_authenticated/_shell/utilities/business/archive";
import type { useArchiveTool } from "@/route/_authenticated/_shell/utilities/business/use-archive-tool";
import { ArchiveOutputSettings } from "@/route/_authenticated/_shell/utilities/business/ArchiveOutputSettings";
type Props = { tool: ReturnType<typeof useArchiveTool>; isCompress: boolean };

export function ArchiveOutput({ tool, isCompress }: Props): JSX.Element {
  const [showOptions, setShowOptions] = useState(false);
  const isBusy = tool.phase === "busy";

  return (
    <footer className="mt-3 shrink-0 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">输出文件</p>
          <p className="mt-1 truncate text-sm font-medium" title={tool.outputName}>
            {tool.outputName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="输出设置"
            aria-haspopup="dialog"
            disabled={isBusy}
            onClick={() => {
              setShowOptions(true);
            }}
          >
            <Settings2 size={16} />
          </Button>
          {isBusy ? (
            <Button type="button" variant="outline" onClick={tool.cancel}>
              取消处理
            </Button>
          ) : tool.result ? (
            <Button
              asChild
              variant="outline"
              className={clsx(
                "border-(--brand-leaf-border) bg-surface-green-50 text-text-green shadow-none",
                "hover:bg-surface-green-100 hover:text-text-green",
              )}
            >
              <a href={tool.result.url} download={tool.outputName}>
                <Download /> 下载文件
              </a>
            </Button>
          ) : (
            <AppDialogAction
              tone="brand"
              className="h-9 flex-none gap-2"
              onClick={() => {
                void tool.start();
              }}
            >
              {tool.phase === "error" ? "重试" : "开始处理"}
              <ArrowRight size={16} />
            </AppDialogAction>
          )}
        </div>
      </div>
      <div role="status" aria-live="polite" className="mt-1 text-xs text-muted-foreground">
        {isBusy && (
          <span className="flex items-center gap-2">
            <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" />
            已处理 {tool.progress.completedFiles} 项 · {formatSize(tool.progress.processedBytes)}
          </span>
        )}
        {tool.phase === "done" && tool.result && (
          <span className="flex items-center gap-2 text-text-green">
            <Check size={15} /> 已完成 · {formatSize(tool.result.file.size)}
          </span>
        )}
        {tool.phase === "cancelled" && <span>已取消，可重新开始</span>}
      </div>
      {showOptions && (
        <ArchiveOutputSettings
          tool={tool}
          isCompress={isCompress}
          onClose={() => {
            setShowOptions(false);
          }}
        />
      )}
    </footer>
  );
}
