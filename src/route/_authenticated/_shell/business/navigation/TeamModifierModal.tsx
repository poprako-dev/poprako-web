import { useState } from "react";
import type { ReactElement } from "react";
import { AlignLeft, Loader2, Type } from "lucide-react";
import clsx from "clsx";
import { IconInputRow } from "@/shared/component/IconInputRow";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";
import type { Result } from "@/shared/utility/result";

type UpdateTeamArgs = {
  name: string;
  description?: string | undefined;
};

type Props = {
  team: TeamConfig;
  onUpdate: (args: UpdateTeamArgs) => Promise<Result<void>>;
  onClose: () => void;
};

export function TeamModifierModal({ team, onUpdate, onClose }: Props): ReactElement {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.desc,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = formData.name.trim().length > 0;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
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
        <div
          aria-hidden="true"
          className="h-1 w-full opacity-20"
          style={{ background: "var(--brand-leaf)" }}
        />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-lg font-bold text-ink-slate-800">修改汉化组信息</h3>
          <p className="mt-1 text-[11px] text-text-muted-cool">{team.name}</p>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="px-5 pb-5 pt-3"
        >
          <div className="space-y-2.5">
            <IconInputRow
              icon={<Type size={14} />}
              placeholder="名称"
              value={formData.name}
              onChange={(v) => {
                setFormData({ ...formData, name: v });
              }}
            />

            <div
              className={clsx(
                "flex items-start gap-2.5 rounded-md px-3 py-2",
                "border border-line-slate-200 bg-surface-white shadow-sm shadow-shadow-slate-100",
                "hover:border-line-slate-300",
                "focus-within:border-line-slate-300 transition-all",
              )}
            >
              <AlignLeft className="w-3.5 h-3.5 text-text-muted-cool mt-0.5 shrink-0" />
              <textarea
                placeholder="描述（选填）"
                rows={2}
                className={clsx(
                  "w-full bg-transparent text-sm text-ink-slate-700",
                  "placeholder:text-text-muted-cool outline-none resize-none",
                )}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                }}
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
                "text-text-muted-cool bg-surface-slate-50 hover:bg-surface-slate-100",
                "border border-line-slate-100",
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
                      "bg-surface-green-50 text-text-leaf",
                      "border border-(--brand-leaf-border)",
                      "hover:bg-surface-green-100",
                    ]
                  : "bg-surface-slate-50 text-text-muted-cool cursor-not-allowed border border-line-slate-100",
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
