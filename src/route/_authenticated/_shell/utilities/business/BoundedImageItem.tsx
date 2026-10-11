import type { JSX } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/shared/component/Button";
import { formatSize } from "@/route/_authenticated/_shell/utilities/business/archive";
import { imageLimit } from "@/route/_authenticated/_shell/utilities/business/bounded-images";
import type { BoundedImage } from "@/route/_authenticated/_shell/utilities/business/bounded-images";
import type { useBoundedCompression } from "@/route/_authenticated/_shell/utilities/business/use-bounded-compression";
import { ImageSizeInput } from "@/route/_authenticated/_shell/utilities/business/ImageSizeInput";

export function BoundedImageItem({
  item,
  index,
  tool,
}: {
  item: BoundedImage;
  index: number;
  tool: ReturnType<typeof useBoundedCompression>;
}): JSX.Element {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1 basis-32">
        <p className="truncate text-sm font-medium" title={item.file.name}>
          {item.file.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className={index === 0 ? "text-text-green" : undefined}>
            {index === 0 ? "封面" : "正文"}
          </span>
          {" · "}
          {formatSize(item.file.size)}
          {" · "}
          {item.limitKiB === null ? "跟随默认" : "单独设置"}
        </p>
      </div>
      <ImageSizeInput
        label={`${item.file.name} 压缩上限`}
        value={imageLimit(item, index, tool.body, tool.cover)}
        disabled={tool.busy}
        onChange={(value) => {
          tool.updateItems(
            tool.items.map((entry) =>
              entry.id === item.id ? { ...entry, limitKiB: value } : entry,
            ),
          );
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`恢复 ${item.file.name} 默认上限`}
        disabled={tool.busy || item.limitKiB === null}
        onClick={() => {
          tool.updateItems(
            tool.items.map((entry) =>
              entry.id === item.id ? { ...entry, limitKiB: null } : entry,
            ),
          );
        }}
      >
        <RotateCcw size={14} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`移除 ${item.file.name}`}
        disabled={tool.busy}
        onClick={() => {
          tool.updateItems(tool.items.filter((entry) => entry.id !== item.id));
        }}
      >
        <X size={16} />
      </Button>
    </li>
  );
}
