import { useState } from "react";
import { Loader2, AlignLeft, Layers } from "lucide-react";
import clsx from "clsx";
import type { Result } from "@/types/utils/result";
import type { ComicInfo } from "@/types";

type Props = {
  comicInfo: ComicInfo;
  onCreateChapter: (subtitle?: string) => Promise<Result<string>>;
  onClose: () => void;
};

export default function ChapterCreatorModal({
  comicInfo,
  onCreateChapter,
  onClose,
}: Props) {
  const [subtitle, setSubtitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onCreateChapter(subtitle.trim() || undefined);
    setIsSubmitting(false);
    if (result.success) onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-white/40 backdrop-blur-sm",
        "animate-in fade-in duration-200",
        "shadow-lg border border-slate-200",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 bg-white",
          "border border-slate-100 rounded-md",
          "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
          "overflow-hidden animate-in zoom-in-95 duration-200",
        )}
      >
        <div className="pt-3 pb-2 text-center">
          <h3 className="text-lg font-bold text-slate-800">新建章节</h3>
          <div className="mt-3 flex items-center justify-center gap-1.5 px-4">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md">
              <Layers className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[12px] text-slate-500 truncate max-w-20">
                {comicInfo.title || "未知作品"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-3">
            <div
              className={clsx(
                "flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-xl",
                "focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-200 transition-all",
                "border border-slate-100",
              )}
            >
              <AlignLeft className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
              <input
                type="text"
                placeholder="章节副标题（选填）"
                className={clsx(
                  "w-full bg-transparent text-sm text-slate-700",
                  "placeholder:text-slate-300 outline-none",
                )}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all active:scale-95",
                "text-slate-400 bg-gray-50 hover:bg-gray-100",
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all active:scale-95",
                "flex items-center justify-center gap-1",
                "bg-gray-50 text-slate-600",
                "hover:bg-emerald-50 hover:text-emerald-600",
                "border border-transparent hover:border-emerald-100",
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
