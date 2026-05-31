import { useState } from "react";
import { AlignLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import IconInputRow from "@/components/ui/IconInputRow";
import type { ChapterInfo } from "@/types";
import type { Result } from "@/types/utils/result";

type UpdateChapterArgs = {
  subtitle?: string;
};

type Props = {
  chapter: ChapterInfo;
  onUpdate: (args: UpdateChapterArgs) => Promise<Result<void>>;
  onClose: () => void;
};

export default function ChapterModifierModal({
  chapter,
  onUpdate,
  onClose,
}: Props) {
  const [subtitle, setSubtitle] = useState(chapter.subtitle ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onUpdate({
      subtitle: subtitle.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result.success) onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-90 flex items-center justify-center p-4",
        "bg-white/60 backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 rounded-xl overflow-hidden",
          "bg-white",
          "border border-(--color-border-green-200)",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        <div
          className="h-1 w-full opacity-20"
          style={{ background: "var(--color-green-500)" }}
        />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-base font-bold text-slate-800">修改章节信息</h3>
          <p className="mt-1 text-[11px] text-slate-400">
            #{chapter.index + 1} {chapter.subtitle || "无标题"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3">
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
                "text-slate-400 bg-slate-50 hover:bg-slate-100",
                "border border-slate-100",
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
                "bg-green-50 text-green-500",
                "border border-(--color-border-green-200)",
                "hover:bg-green-100",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "确认"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
