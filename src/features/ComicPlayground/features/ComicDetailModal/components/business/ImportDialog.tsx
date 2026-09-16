import { useId, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ImportChapterMode } from "../../../../types/chapter";

interface Props {
  fileName: string;
  loading: boolean;
  onConfirm: (mode: ImportChapterMode) => void;
  onCancel: () => void;
}

export default function ImportTranslationDialog({
  fileName, loading, onConfirm, onCancel,
}: Props) {
  const [mode, setMode] = useState<ImportChapterMode>("keep");
  const inputId = useId();

  return (
    <ConfirmDialog
      title="导入翻校"
      description={`文件：${fileName}`}
      confirmLabel="确认导入"
      confirmTone={mode === "overwrite" ? "danger" : "success"}
      loading={loading}
      onConfirm={() => { onConfirm(mode); }}
      onCancel={() => { if (!loading) {onCancel();} }}
    >
      <fieldset disabled={loading} className="space-y-4 px-5 py-4">
        <legend className="sr-only">已有翻校内容的处理方式</legend>
        <label
          htmlFor={`${inputId}-keep`}
          aria-label="保留已有内容"
          className="flex cursor-pointer items-start gap-3 text-sm"
        >
          <input
            id={`${inputId}-keep`}
            type="radio"
            name="translation-import-mode"
            value="keep"
            checked={mode === "keep"}
            onChange={() => { setMode("keep"); }}
            className="mt-1 accent-primary"
          />
          <span>
            <span className="block font-medium text-foreground">保留已有内容</span>
            <span className="mt-1 block text-muted-foreground">
              跳过已有翻校内容的页面，仅导入空白页面。
            </span>
          </span>
        </label>
        <label
          htmlFor={`${inputId}-overwrite`}
          aria-label="覆盖已有内容"
          className="flex cursor-pointer items-start gap-3 text-sm"
        >
          <input
            id={`${inputId}-overwrite`}
            type="radio"
            name="translation-import-mode"
            value="overwrite"
            checked={mode === "overwrite"}
            onChange={() => { setMode("overwrite"); }}
            className="mt-1 accent-primary"
          />
          <span>
            <span className="block font-medium text-foreground">覆盖已有内容</span>
            <span className="mt-1 block text-muted-foreground">
              用文件内容替换匹配页面的已有翻校内容。
            </span>
          </span>
        </label>
      </fieldset>
    </ConfirmDialog>
  );
}
