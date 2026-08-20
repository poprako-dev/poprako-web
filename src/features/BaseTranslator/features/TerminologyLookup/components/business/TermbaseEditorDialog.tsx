import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { TermbaseInfo } from "@/types/termbase";
import type { UpdateTermbaseArgs } from "@/features/BaseTranslator/types/terminology";
import TerminologyDialogFrame from "./TerminologyDialogFrame";

type Props = {
  termbase?: TermbaseInfo;
  onSave: (args: UpdateTermbaseArgs) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onClose: () => void;
};

export default function TermbaseEditorDialog({
  termbase,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState(termbase?.name ?? "");
  const [description, setDescription] = useState(termbase?.description ?? "");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = termbase !== undefined;
  const isValid = name.trim().length > 0;

  const handleSave = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    const success = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setIsSubmitting(false);
    if (success) onClose();
  };

  const handleDelete = async () => {
    if (!onDelete || isSubmitting) return;
    setIsSubmitting(true);
    const success = await onDelete();
    setIsSubmitting(false);
    if (success) onClose();
  };

  if (isConfirmingDelete && termbase && onDelete) {
    return (
      <TerminologyDialogFrame
        title="删除术语库"
        locked={isSubmitting}
        onClose={onClose}
        footer={(
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsConfirmingDelete(false)}
              className={clsx(
                "h-8 flex-1 rounded-sm border border-stone-200",
                "text-xs font-medium text-stone-500 hover:bg-stone-50",
              )}
            >
              返回
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDelete}
              className={clsx(
                "flex h-8 flex-1 items-center justify-center gap-1 rounded-sm",
                "border border-red-200 bg-red-50 text-xs font-medium text-red-600",
                "hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isSubmitting && <LoaderCircle size={13} className="animate-spin" />}
              确认删除
            </button>
          </div>
        )}
      >
        <div className="rounded-sm border border-red-100 bg-red-50/60 px-3 py-2.5">
          <p className="text-xs font-medium text-stone-700">{termbase.name}</p>
          <p className="mt-1 text-[11px] leading-4 text-red-600">
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
      footer={(
        <div className="flex items-center gap-2">
          {isEditing && onDelete && (
            <button
              type="button"
              aria-label="删除术语库"
              disabled={isSubmitting}
              onClick={() => setIsConfirmingDelete(true)}
              className={clsx(
                "flex size-8 items-center justify-center rounded-sm border",
                "border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600",
              )}
            >
              <Trash2 size={13} />
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="h-8 rounded-sm px-3 text-xs font-medium text-stone-500 hover:bg-stone-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={handleSave}
            className={clsx(
              "flex h-8 min-w-18 items-center justify-center gap-1 rounded-sm border",
              "border-green-100 bg-green-50 px-3 text-xs font-medium text-stone-700",
              "hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-45",
            )}
          >
            {isSubmitting && <LoaderCircle size={13} className="animate-spin" />}
            保存
          </button>
        </div>
      )}
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-stone-500">名称</span>
          <input
            autoFocus
            value={name}
            disabled={isSubmitting}
            onChange={(event) => setName(event.target.value)}
            className={clsx(
              "h-8 w-full rounded-sm border border-stone-200 bg-stone-50/50 px-2.5",
              "text-xs text-stone-700 outline-none focus:border-stone-300 focus:bg-white",
            )}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-stone-500">描述</span>
          <textarea
            rows={3}
            value={description}
            disabled={isSubmitting}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="选填"
            className={clsx(
              "w-full resize-none rounded-sm border border-stone-200 bg-stone-50/50 px-2.5 py-2",
              "text-xs leading-4 text-stone-700 outline-none placeholder:text-stone-300",
              "focus:border-stone-300 focus:bg-white",
            )}
          />
        </label>
      </div>
    </TerminologyDialogFrame>
  );
}
