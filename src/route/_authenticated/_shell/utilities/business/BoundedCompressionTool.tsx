import { type JSX, useRef } from "react";
import clsx from "clsx";
import { Download, FilePlus2, LoaderCircle } from "lucide-react";
import { Button } from "@/shared/component/Button";
import { formatSize } from "@/route/_authenticated/_shell/utilities/business/archive";
import { useBoundedCompression } from "@/route/_authenticated/_shell/utilities/business/use-bounded-compression";
import { ImageSizeInput } from "@/route/_authenticated/_shell/utilities/business/ImageSizeInput";
import { BoundedImageItem } from "@/route/_authenticated/_shell/utilities/business/BoundedImageItem";

export function BoundedCompressionTool(): JSX.Element {
  const tool = useBoundedCompression();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-labelledby="bounded-title"
      aria-busy={tool.busy}
    >
      <h3 id="bounded-title" className="mb-5 shrink-0 text-lg font-semibold">
        定界压缩
      </h3>
      <div className="mb-5 inline-flex w-fit shrink-0 flex-wrap gap-x-6 gap-y-3">
        <ImageSizeInput
          label="默认正文大小"
          value={tool.body}
          disabled={tool.busy}
          onChange={(value) => {
            tool.changeDefault("body", value);
          }}
        />
        <ImageSizeInput
          label="默认封面大小"
          value={tool.cover}
          disabled={tool.busy}
          onChange={(value) => {
            tool.changeDefault("cover", value);
          }}
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.bmp"
        className="hidden"
        aria-label="选择待压缩图片"
        disabled={tool.busy}
        onChange={(event) => {
          tool.addFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={tool.busy}
        onClick={() => {
          inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          tool.addFiles([...event.dataTransfer.files]);
        }}
        className={clsx(
          "flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-dashed",
          "border-input bg-muted/30 p-4 text-sm hover:bg-muted/50 disabled:opacity-50",
          "focus-visible:outline-2 focus-visible:outline-ring",
        )}
      >
        <FilePlus2 size={20} className="text-text-green" />
        {tool.items.length > 0 ? "添加图片" : "选择或拖入多张图片"}
      </button>
      <p className="my-2 shrink-0 text-xs leading-relaxed text-muted-foreground">
        JPG / PNG / WebP / BMP · 最多 1,000 张 · 合计 8 GiB
        <br />按 Windows 风格自然名称序排列，首张为封面。1 MiB = 1024 KiB。
        为满足上限，可能降低画质与分辨率。
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ol className="divide-y divide-border/60">
          {tool.items.map((item, index) => (
            <BoundedImageItem key={item.id} item={item} index={index} tool={tool} />
          ))}
        </ol>
      </div>
      <footer className="mt-3 shrink-0 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{tool.items.length} 张图片 → 定界压缩.zip</span>
          {tool.busy ? (
            <Button variant="outline" onClick={tool.cancel}>
              取消处理
            </Button>
          ) : tool.result ? (
            <Button asChild variant="outline">
              <a href={tool.result.url} download="定界压缩.zip">
                <Download />
                下载 ZIP
              </a>
            </Button>
          ) : (
            <Button
              disabled={!tool.isValid}
              onClick={() => {
                void tool.start();
              }}
            >
              开始压缩
            </Button>
          )}
        </div>
        <p role="status" className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {tool.busy ? (
            <>
              <LoaderCircle size={14} className="animate-spin" />
              已处理 {tool.completed} / {tool.items.length} 张
            </>
          ) : (
            tool.status
          )}
          {tool.result && ` · ${formatSize(tool.result.file.size)}`}
        </p>
        {!tool.isValid && tool.items.length > 0 && (
          <p className="mt-1 text-xs text-destructive">请填写有效的大小上限，至少 1 KiB。</p>
        )}
      </footer>
    </section>
  );
}
