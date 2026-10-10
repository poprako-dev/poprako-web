import type { JSX } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { Select } from "radix-ui";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import type { useArchiveTool } from "@/route/_authenticated/_shell/utilities/business/use-archive-tool";

const PRESET_OPTIONS = [
  { id: "0", text: "速度优先" },
  { id: "3", text: "均衡" },
  { id: "6", text: "体积优先" },
];

export function ArchiveOutputSettings({
  tool,
  isCompress,
  onClose,
}: {
  tool: ReturnType<typeof useArchiveTool>;
  isCompress: boolean;
  onClose: () => void;
}): JSX.Element {
  return (
    <AppDialog
      title="输出设置"
      onClose={onClose}
      footer={
        <div className="flex w-full">
          <AppDialogAction tone="brand" className="w-full" onClick={onClose}>
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
                  "border border-input bg-surface-white text-sm text-foreground outline-none",
                  "transition-colors hover:border-line-slate-300",
                  "focus-visible:border-(--brand-leaf-border)",
                )}
                aria-label="压缩偏好"
              >
                <Select.Value />
                <Select.Icon asChild>
                  <ChevronDown size={16} className="text-icon-muted-cool" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={6}
                  className={clsx(
                    "z-110 min-w-(--radix-select-trigger-width) overflow-hidden",
                    "rounded-md border border-line-slate-200 bg-surface-white p-1 shadow-lg",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0",
                    "data-[state=open]:zoom-in-95 motion-reduce:animate-none",
                  )}
                >
                  <Select.Viewport>
                    {PRESET_OPTIONS.map((option) => (
                      <Select.Item
                        key={option.id}
                        value={option.id}
                        className={clsx(
                          "relative flex h-9 cursor-pointer select-none items-center",
                          "rounded-sm px-3 pr-8 text-sm text-ink-slate-600 outline-none",
                          "data-[highlighted]:bg-surface-green-50 data-[highlighted]:text-text-green",
                          "data-[state=checked]:font-semibold",
                          "data-[state=checked]:text-text-green",
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
  );
}
