import { type JSX, memo } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/shared/component/Button";
import { formatSize } from "@/route/_authenticated/_shell/utilities/business/archive";
import type { BoundedImage } from "@/route/_authenticated/_shell/utilities/business/bounded-images";
import type { BoundedItemActions } from "./bounded-compression-actions";
import { ImageSizeInput } from "@/route/_authenticated/_shell/utilities/business/ImageSizeInput";

type Props = BoundedItemActions & {
  item: BoundedImage;
  isCover: boolean;
  value: string;
  busy: boolean;
};

function BoundedImageItemView({
  item,
  isCover,
  value,
  busy,
  changeLimit,
  removeItem,
}: Props): JSX.Element {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1 basis-32">
        <p className="truncate text-sm font-medium" title={item.file.name}>
          {item.file.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className={isCover ? "text-text-green" : undefined}>
            {isCover ? "封面" : "正文"}
          </span>
          {" · "}
          {formatSize(item.file.size)}
          {" · "}
          {item.limitKiB === null ? "跟随默认" : "单独设置"}
        </p>
      </div>
      <ImageSizeInput
        label={`${item.file.name} 压缩上限`}
        value={value}
        disabled={busy}
        onChange={(value) => {
          changeLimit(item.id, value);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`恢复 ${item.file.name} 默认上限`}
        disabled={busy || item.limitKiB === null}
        onClick={() => {
          changeLimit(item.id, null);
        }}
      >
        <RotateCcw size={14} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`移除 ${item.file.name}`}
        disabled={busy}
        onClick={() => {
          removeItem(item.id);
        }}
      >
        <X size={16} />
      </Button>
    </li>
  );
}

export const BoundedImageItem = memo(BoundedImageItemView);
