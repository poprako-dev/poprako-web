import { useState } from "react";
import { Type, AlignLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import IconInputRow from "@/components/ui/IconInputRow";
import type { WorksetInfo } from "@/types/workset";
import type { Result } from "@/types/utils/result";

type UpdateWorksetArgs = {
  name: string;
  description?: string;
};

type Props = {
  workset: WorksetInfo;
  onUpdate: (args: UpdateWorksetArgs) => Promise<Result<void>>;
  onClose: () => void;
};

export default function WorksetModifierModal({
  workset,
  onUpdate,
  onClose,
}: Props) {
  const [formData, setFormData] = useState({
    name: workset.name ?? "",
    description: workset.description ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = formData.name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    const result = await onUpdate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
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
          <h3 className="text-lg font-bold text-slate-800">修改作品集信息</h3>
          <p className="mt-1 text-[11px] text-slate-400">
            #{workset.index + 1} {workset.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3">
          <div className="space-y-2.5">
            <IconInputRow
              icon={<Type size={14} />}
              placeholder="名称"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
            />

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
                placeholder="描述（选填）"
                rows={2}
                className={clsx(
                  "w-full bg-transparent text-sm text-slate-700",
                  "placeholder:text-slate-400 outline-none resize-none",
                )}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                "确认"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
