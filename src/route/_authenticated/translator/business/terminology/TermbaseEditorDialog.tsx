import type { JSX } from "react/jsx-runtime";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import clsx from "clsx";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type { UpdateTermbaseArgs } from "@/route/_authenticated/translator/business/contract/terminology";
import { AppDialogAction } from "@/shared/component/AppDialog";
import { TerminologyDialogFrame } from "@/route/_authenticated/translator/business/terminology/TerminologyDialogFrame";

type Props = {
  termbase?: TermbaseInfo | undefined;
  onSave: (args: UpdateTermbaseArgs) => Promise<boolean>;
  onDelete?: (() => Promise<boolean>) | undefined;
  onClose: () => void;
};

export function TermbaseEditorDialog({ termbase, onSave, onDelete, onClose }: Props): JSX.Element {
  const [name, setName] = useState(termbase?.name ?? "");
  const [description, setDescription] = useState(termbase?.description ?? "");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = termbase !== undefined;
  const isValid = name.trim().length > 0;

  const handleSave = async (): Promise<void> => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    const isSuccess = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setIsSubmitting(false);
    if (isSuccess) onClose();
  };

  const handleDelete = async (): Promise<void> => {
    if (!onDelete || isSubmitting) return;
    setIsSubmitting(true);
    const isSuccess = await onDelete();
    setIsSubmitting(false);
    if (isSuccess) onClose();
  };

  if (isConfirmingDelete && termbase && onDelete) {
    return (
      <TerminologyDialogFrame
        title="删除术语库"
        locked={isSubmitting}
        onClose={onClose}
        footer={
          <div className="flex gap-2">
            <AppDialogAction
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsConfirmingDelete(false);
              }}
            >
              返回
            </AppDialogAction>
            <AppDialogAction
              type="button"
              tone="danger"
              disabled={isSubmitting}
              onClick={() => {
                void handleDelete();
              }}
            >
              {isSubmitting && <LoaderCircle size={13} className="animate-spin" />}
              确认删除
            </AppDialogAction>
          </div>
        }
      >
        <div className="rounded-md border border-line-red-100 bg-surface-red-50/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-ink-slate-700">{termbase.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-red-500">
            删除后，其中全部术语也会一并删除。
          </p>
        </div>
      </TerminologyDialogFrame>
    );
  }

  return (
    <TerminologyDialogFrame
      title={isEditing ? "编辑术语库" : "新建术语库"}
      locked={isSubmitting}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {isEditing && onDelete && (
            <AppDialogAction
              type="button"
              tone="danger"
              disabled={isSubmitting}
              onClick={() => {
                setIsConfirmingDelete(true);
              }}
            >
              删除
            </AppDialogAction>
          )}
          <AppDialogAction type="button" disabled={isSubmitting} onClick={onClose}>
            取消
          </AppDialogAction>
          <AppDialogAction
            type="button"
            tone="brand"
            disabled={!isValid || isSubmitting}
            onClick={() => {
              void handleSave();
            }}
          >
            {isSubmitting && <LoaderCircle size={13} className="animate-spin" />}
            保存
          </AppDialogAction>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-slate-500">名称</span>
          <input
            value={name}
            disabled={isSubmitting}
            onChange={(event) => {
              setName(event.target.value);
            }}
            className={clsx(
              "h-8 w-full rounded-md border border-line-slate-200 bg-surface-white px-2.5",
              "text-sm text-ink-slate-700 shadow-sm shadow-shadow-slate-100 outline-none",
              "transition-colors focus:border-line-slate-300",
            )}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-slate-500">描述</span>
          <textarea
            rows={3}
            value={description}
            disabled={isSubmitting}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            placeholder="选填"
            className={clsx(
              "w-full resize-none rounded-md border border-line-slate-200 bg-surface-white px-2.5 py-2",
              "text-sm leading-relaxed text-ink-slate-700 shadow-sm shadow-shadow-slate-100",
              "outline-none placeholder:text-ink-slate-300 focus:border-line-slate-300",
            )}
          />
        </label>
      </div>
    </TerminologyDialogFrame>
  );
}
