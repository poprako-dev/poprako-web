import { useState } from "react";
import { Users, Type, AlignLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import IconInputRow from "@/components/ui/IconInputRow";
import type { Result } from "@/types/utils/result";

type Props = {
  teamName: string;
  onSubmit: (args: {
    title: string;
    content: string;
  }) => Promise<Result<string>>;
  onClose: () => void;
};

export default function AnnouncementCreatorModal({ teamName, onSubmit, onClose }: Props) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    formData.title.trim().length > 0 && formData.content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    const result = await onSubmit({
      title: formData.title.trim(),
      content: formData.content.trim(),
    });
    setIsSubmitting(false);
    if (result.success) onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
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
        {/* 顶部品牌色条 */}
        <div
          className="h-1 w-full opacity-20"
          style={{ background: "var(--color-green-500)" }}
        />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-lg font-bold text-slate-800">发布公告</h3>
          <div className="mt-2 flex items-center justify-center gap-1.5 px-4">
            <div
              className={clsx(
                "flex items-center gap-1 px-2 py-0.5 rounded-md",
                "bg-green-50 border border-(--color-border-green-200)",
              )}
            >
              <Users className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[11px] text-slate-500">{teamName}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3">
          <div className="space-y-2.5">
            <IconInputRow
              icon={<Type size={14} />}
              placeholder="公告主题"
              value={formData.title}
              onChange={(v) => setFormData({ ...formData, title: v })}
            />

            {/* 内容 textarea — 与 IconInputRow 风格对齐 */}
            <div
              className={clsx(
                "flex items-start gap-2.5 rounded-md px-3 py-2",
                "border border-slate-200 bg-white shadow-sm shadow-slate-100",
                "hover:border-slate-300",
                "focus-within:border-slate-300 transition-all",
              )}
            >
              <AlignLeft className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <textarea
                placeholder="公告内容"
                rows={3}
                className={clsx(
                  "w-full bg-transparent text-sm text-slate-700",
                  "placeholder:text-slate-400 outline-none resize-none",
                )}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
          </div>

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
              disabled={isSubmitting || !isValid}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "flex items-center justify-center gap-1",
                "transition-all duration-200 active:scale-[0.98]",
                isValid
                  ? [
                      "bg-green-50 text-green-500",
                      "border border-(--color-border-green-200)",
                      "hover:bg-green-100",
                    ]
                  : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100",
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "发布"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
