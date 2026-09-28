import { type JSX, useState } from "react";
import { AlignLeft, Loader2, Type } from "lucide-react";
import clsx from "clsx";
import { IconInputRow } from "@/shared/component/IconInputRow";
import type { Result } from "@/shared/utility/result";
import type { CreateWorksetArgs } from "@/route/_authenticated/_shell/comic-playground/business/workset/workset-input";

type Props = {
  teamId: string;
  onCreateWorkset: (args: CreateWorksetArgs) => Promise<Result<string>>;
  onClose: () => void;
};

export function WorksetCreatorModal({ teamId, onCreateWorkset, onClose }: Props): JSX.Element {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = formData.name.trim().length > 0;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
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
        "bg-overlay backdrop-blur-sm",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={clsx(
          "w-full max-w-70 rounded-xl overflow-hidden",
          "bg-surface-panel",
          "border border-border",
          "shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        {/* 顶部品牌色条 */}
        <div className="h-1 w-full bg-primary opacity-20" />

        <div className="pt-4 pb-2 text-center">
          <h3 className="text-lg font-bold text-foreground">新建作品集</h3>
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

            {/* 描述 textarea — 与 IconInputRow 风格对齐 */}
            <div
              className={clsx(
                "flex items-start gap-2.5 rounded-md px-3 py-2",
                "border border-border bg-surface-panel shadow-sm shadow-border/50",
                "hover:border-border",
                "focus-within:border-border transition-all",
              )}
            >
              <AlignLeft className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <textarea
                placeholder="描述（选填）"
                rows={2}
                className={clsx(
                  "w-full bg-transparent text-sm text-foreground",
                  "placeholder:text-muted-foreground outline-none resize-none",
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
                "text-muted-foreground bg-muted hover:bg-accent",
                "border border-border",
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
                      "bg-primary-subtle text-primary-text",
                      "border border-primary-border",
                      "hover:bg-primary-muted",
                    ]
                  : "bg-muted text-muted-foreground cursor-not-allowed border border-border",
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
