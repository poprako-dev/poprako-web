import { type JSX, useState } from "react";
import { AlignLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import { IconInputRow } from "@/shared/component/IconInputRow";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { Result } from "@/shared/utility/result";

type UpdateChapterArgs = {
  subtitle?: string | undefined;
};

type Props = {
  chapter: ChapterInfo;
  onUpdate: (args: UpdateChapterArgs) => Promise<Result<void>>;
  onClose: () => void;
};

export function ChapterModifierModal({ chapter, onUpdate, onClose }: Props): JSX.Element {
  const [subtitle, setSubtitle] = useState(chapter.subtitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onUpdate({
      subtitle: subtitle.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-90 flex items-center justify-center p-4",
        "bg-surface-white/60 backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 rounded-xl overflow-hidden",
          "bg-surface-white",
          "border border-(--brand-leaf-border)",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        <div className="h-1 w-full opacity-20" style={{ background: "var(--brand-leaf)" }} />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-base font-bold text-ink-slate-800">修改章节信息</h3>
          <p className="mt-1 text-[11px] text-text-muted-cool">
            #{chapter.index + 1} {chapter.subtitle || "无标题"}
          </p>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="px-5 pb-5 pt-3"
        >
          <IconInputRow
            icon={<AlignLeft size={14} />}
            placeholder="章节副标题"
            value={subtitle}
            onChange={setSubtitle}
          />

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "transition-all duration-200 active:scale-[0.98]",
                "text-text-muted-cool bg-surface-slate-50 hover:bg-surface-slate-100",
                "border border-line-slate-100",
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "flex items-center justify-center gap-1",
                "transition-all duration-200 active:scale-[0.98]",
                "bg-surface-green-50 text-text-leaf",
                "border border-(--brand-leaf-border)",
                "hover:bg-surface-green-100",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "确认"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
