import { type JSX, useId, useState } from "react";
import { AlignLeft, Loader2, Type } from "lucide-react";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { IconInputRow } from "@/shared/component/IconInputRow";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { Result } from "@/shared/utility/result";
import type { UpdateWorksetArgs } from "./workset/workset-input";
import { useWorksetSubmission } from "./use-workset-submission";

type Props = {
  workset: WorksetInfo;
  onUpdate: (args: UpdateWorksetArgs) => Promise<Result<void>>;
  onDelete?: (() => Promise<Result<void>>) | undefined;
  onClose: () => void;
};

export function WorksetModifierModal({ workset, onUpdate, onDelete, onClose }: Props): JSX.Element {
  const formId = useId();
  const [formData, setFormData] = useState({
    name: workset.name,
    description: workset.description,
  });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { isSubmitting, submit } = useWorksetSubmission(onClose);
  const isValid = formData.name.trim().length > 0;

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!isValid) return;
    await submit(() =>
      onUpdate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      }),
    );
  };

  if (isConfirmingDelete && onDelete) {
    return (
      <AppDialog
        title="确认删除作品集"
        description="删除后，其中全部作品及章节页面也会一并删除，此操作不可撤销。"
        size="compact"
        tone="warning"
        locked={isSubmitting}
        onClose={() => {
          setIsConfirmingDelete(false);
        }}
        footer={
          <div className="flex gap-2">
            <AppDialogAction
              tone="danger"
              disabled={isSubmitting}
              onClick={() => {
                void submit(onDelete);
              }}
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              确认删除
            </AppDialogAction>
          </div>
        }
      >
        <div className="rounded-md border border-line-red-100 bg-surface-red-50/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-ink-slate-700">{workset.name}</p>
        </div>
      </AppDialog>
    );
  }

  return (
    <AppDialog
      title="修改作品集信息"
      description={`#${String(workset.index + 1)} ${workset.name}`}
      size="compact"
      locked={isSubmitting}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {onDelete && (
            <AppDialogAction
              tone="danger"
              disabled={isSubmitting}
              onClick={() => {
                setIsConfirmingDelete(true);
              }}
            >
              删除
            </AppDialogAction>
          )}
          <AppDialogAction
            type="submit"
            form={formId}
            tone="brand"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "确认"}
          </AppDialogAction>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <fieldset disabled={isSubmitting} className="space-y-2.5">
          <IconInputRow
            icon={<Type size={14} />}
            placeholder="名称"
            value={formData.name}
            onChange={(name) => {
              setFormData({ ...formData, name });
            }}
          />
          <div
            className={clsx(
              "flex items-start gap-2.5 rounded-md px-3 py-2",
              "border border-line-slate-200 bg-surface-white shadow-sm shadow-shadow-slate-100",
              "hover:border-line-slate-300",
              "transition-all",
            )}
          >
            <AlignLeft className="w-3.5 h-3.5 text-icon-muted-cool mt-0.5 shrink-0" />
            <textarea
              aria-label="描述（选填）"
              placeholder="描述（选填）"
              rows={2}
              className={clsx(
                "w-full bg-transparent text-sm text-ink-slate-700",
                "placeholder:text-text-muted-cool outline-none resize-none",
              )}
              value={formData.description}
              onChange={(event) => {
                setFormData({ ...formData, description: event.target.value });
              }}
            />
          </div>
        </fieldset>
      </form>
    </AppDialog>
  );
}
