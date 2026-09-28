import { type JSX, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, ChevronDown, Download, LoaderCircle, Settings2 } from "lucide-react";
import { Select } from "radix-ui";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { Button } from "@/shared/component/Button";
import { formatSize } from "@/routes/_authenticated/_shell/utilities/business/archive";
import type { useArchiveTool } from "@/routes/_authenticated/_shell/utilities/business/use-archive-tool";

const presetOptions = [
  { id: "0", text: "速度优先" },
  { id: "3", text: "均衡" },
  { id: "6", text: "体积优先" },
];
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
                "border-(--color-border-green-200) bg-green-50 text-green-600 shadow-none",
                "hover:bg-green-100 hover:text-green-600",
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
          <span className="flex items-center gap-2 text-green-600">
            <Check size={15} /> 已完成 · {formatSize(tool.result.file.size)}
          </span>
        )}
        {tool.phase === "cancelled" && <span>已取消，可重新开始</span>}
      </div>
      {showOptions && (
        <AppDialog
          title="输出设置"
          onClose={() => {
            setShowOptions(false);
          }}
          footer={
            <div className="flex w-full">
              <AppDialogAction
                tone="brand"
                className="w-full"
                onClick={() => {
                  setShowOptions(false);
                }}
              >
                完成
              </AppDialogAction>
            </div>
          }
        >
          <div className="space-y-4">
            <label className="block text-xs text-muted-foreground">
              输出文件名
              <span className="mt-2 flex items-center rounded-md border border-input">
                <input
                  value={tool.name}
                  onChange={(event) => {
                    tool.setName(event.target.value);
                  }}
                  className={clsx(
                    "h-9 min-w-0 flex-1 rounded-md px-3 text-sm text-foreground",
                    "focus-visible:outline-2 focus-visible:outline-ring",
                  )}
                />
                <span className="px-3">{tool.extension}</span>
              </span>
            </label>
            {isCompress && (
              <div>
                <span className="block text-xs text-muted-foreground">压缩偏好</span>
                <Select.Root
                  value={String(tool.preset)}
                  onValueChange={(optionId) => {
                    tool.setPreset(Number(optionId));
                  }}
                >
                  <Select.Trigger
                    className={clsx(
                      "mt-2 flex h-9 w-full items-center justify-between rounded-md px-3",
                      "border border-input bg-surface-panel text-sm text-foreground outline-none",
                      "transition-colors hover:border-border",
                      "focus-visible:border-(--color-border-green-200)",
                    )}
                    aria-label="压缩偏好"
                  >
                    <Select.Value />
                    <Select.Icon asChild>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={6}
                      className={clsx(
                        "z-110 min-w-(--radix-select-trigger-width) overflow-hidden",
                        "rounded-md border border-border bg-surface-panel p-1 shadow-lg",
                        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
                        "data-[state=open]:zoom-in-95 motion-reduce:animate-none",
                      )}
                    >
                      <Select.Viewport>
                        {presetOptions.map((option) => (
                          <Select.Item
                            key={option.id}
                            value={option.id}
                            className={clsx(
                              "relative flex h-9 cursor-pointer select-none items-center",
                              "rounded-sm px-3 pr-8 text-sm text-text-secondary outline-none",
                              "data-[highlighted]:bg-green-50 data-[highlighted]:text-green-600",
                              "data-[state=checked]:font-semibold",
                              "data-[state=checked]:text-green-600",
                            )}
                          >
                            <Select.ItemText>{option.text}</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-3">
                              <Check size={14} />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}
          </div>
        </AppDialog>
      )}
    </footer>
  );
}
