import { useState } from "react";
import { Type, AlignLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { Result } from "@/types/utils/result";
import type { CreateWorksetArgs } from "../../types/workset";

type Props = {
  teamId: string;
  onCreateWorkset: (args: CreateWorksetArgs) => Promise<Result<string>>;
  onClose: () => void;
};

export default function WorksetCreatorModal({
  teamId,
  onCreateWorkset,
  onClose,
}: Props) {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = formData.name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    const result = await onCreateWorkset({
      teamId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result.success) onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-white/40 backdrop-blur-sm",
        "animate-in fade-in duration-200",
        "border border-slate-200 shadow-lg",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 bg-white",
          "border border-slate-100 rounded-2xl",
          "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
          "overflow-hidden animate-in zoom-in-95 duration-200",
        )}
      >
        <form onSubmit={handleSubmit} className="p-5">
          <div className="pb-4 text-center">
            <h3 className="text-lg font-bold text-slate-700">新建作品集</h3>
          </div>

          <div className="space-y-3">
            <div
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5",
                "bg-slate-50 rounded-xl border border-transparent",
                "focus-within:ring-1 focus-within:ring-slate-200",
                "focus-within:bg-white focus-within:border-slate-200 transition-all",
              )}
            >
              <Type className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                required
                placeholder="名称"
                className={clsx(
                  "w-full bg-transparent text-sm text-slate-700",
                  "placeholder:text-slate-300 focus:outline-none",
                )}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div
              className={clsx(
                "flex items-start gap-3 px-3 py-2.5",
                "bg-slate-50 rounded-xl border border-transparent",
                "focus-within:ring-1 focus-within:ring-slate-200",
                "focus-within:bg-white focus-within:border-slate-200 transition-all",
              )}
            >
              <AlignLeft className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <textarea
                placeholder="描述（选填）"
                rows={2}
                className={clsx(
                  "w-full bg-transparent text-sm text-slate-700",
                  "placeholder:text-slate-300 focus:outline-none resize-none leading-relaxed",
                )}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all active:scale-95",
                "text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-100",
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all active:scale-95",
                "flex items-center justify-center gap-1",
                isValid
                  ? "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100",
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
