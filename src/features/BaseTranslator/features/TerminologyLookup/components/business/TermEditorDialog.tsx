import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { TermInfo } from "@/types/term";
import type { UpdateTermArgs } from "@/features/BaseTranslator/types/terminology";
import { moveTermTarget, validateTermTargets } from "../../hook/termForm";
import TerminologyDialogFrame from "./TerminologyDialogFrame";

type Props = {
  term?: TermInfo;
  onSave: (args: UpdateTermArgs) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onClose: () => void;
};

export default function TermEditorDialog({
  term,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [source, setSource] = useState(term?.source ?? "");
  const [targets, setTargets] = useState(
    term && term.targets.length > 0 ? term.targets : [""],
  );
  const [comment, setComment] = useState(term?.comment ?? "");
  const [hasTouchedTargets, setHasTouchedTargets] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = term !== undefined;

  const targetError = useMemo(() => validateTermTargets(targets), [targets]);
  const visibleTargetError = hasTouchedTargets ? targetError : undefined;
  const isValid = source.trim().length > 0 && !targetError;

  const handleTargetChange = (index: number, value: string) => {
    setHasTouchedTargets(true);
    setTargets((current) => current.map((target, targetIndex) => (
      targetIndex === index ? value : target
    )));
  };

  const handleSave = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    const success = await onSave({
      source: source.trim(),
      targets: targets.map((target) => target.trim()),
      comment: comment.trim() || undefined,
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

  if (isConfirmingDelete && term && onDelete) {
    return (
      <TerminologyDialogFrame
        title="删除术语"
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
          <p className="text-xs font-medium text-stone-700">{term.source}</p>
          <p className="mt-1 text-[11px] leading-4 text-red-600">
            删除后无法恢复该原文和全部译名。
          </p>
        </div>
      </TerminologyDialogFrame>
    );
  }

  return (
    <TerminologyDialogFrame
      title={isEditing ? "编辑术语" : "新建术语"}
      locked={isSubmitting}
      onClose={onClose}
      footer={(
        <div className="flex items-center gap-2">
          {isEditing && onDelete && (
            <button
              type="button"
              aria-label="删除术语"
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
          <span className="mb-1 block text-[11px] font-medium text-stone-500">原文</span>
          <input
            autoFocus
            value={source}
            disabled={isSubmitting}
            onChange={(event) => setSource(event.target.value)}
            className={clsx(
              "h-8 w-full rounded-sm border border-stone-200 bg-stone-50/50 px-2.5",
              "text-xs text-stone-700 outline-none focus:border-stone-300 focus:bg-white",
            )}
          />
        </label>

        <fieldset>
          <div className="mb-1 flex items-center justify-between">
            <legend className="text-[11px] font-medium text-stone-500">译名</legend>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setTargets((current) => [...current, ""])}
              className={clsx(
                "flex h-6 items-center gap-1 rounded-sm px-1.5",
                "text-[10px] text-stone-500 hover:bg-green-50 hover:text-stone-700",
              )}
            >
              <Plus size={11} />
              添加译名
            </button>
          </div>
          <div className="space-y-1.5">
            {targets.map((target, index) => (
              <div key={index} className="flex items-center gap-1">
                <input
                  aria-label={`译名 ${index + 1}`}
                  value={target}
                  disabled={isSubmitting}
                  onChange={(event) => handleTargetChange(index, event.target.value)}
                  onBlur={() => setHasTouchedTargets(true)}
                  className={clsx(
                    "h-8 min-w-0 flex-1 rounded-sm border bg-stone-50/50 px-2.5",
                    "text-xs text-stone-700 outline-none focus:bg-white",
                    visibleTargetError && target.trim().length === 0
                      ? "border-red-200"
                      : "border-stone-200 focus:border-stone-300",
                  )}
                />
                <button
                  type="button"
                  aria-label={`上移译名 ${index + 1}`}
                  disabled={isSubmitting || index === 0}
                  onClick={() => setTargets((current) => (
                    moveTermTarget(current, index, index - 1)
                  ))}
                  className="flex size-7 items-center justify-center text-stone-400 disabled:opacity-20"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  aria-label={`下移译名 ${index + 1}`}
                  disabled={isSubmitting || index === targets.length - 1}
                  onClick={() => setTargets((current) => (
                    moveTermTarget(current, index, index + 1)
                  ))}
                  className="flex size-7 items-center justify-center text-stone-400 disabled:opacity-20"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  aria-label={`删除译名 ${index + 1}`}
                  disabled={isSubmitting || targets.length === 1}
                  onClick={() => setTargets((current) => (
                    current.filter((_, targetIndex) => targetIndex !== index)
                  ))}
                  className="flex size-7 items-center justify-center text-stone-400 hover:text-red-500 disabled:opacity-20"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          {visibleTargetError && (
            <p className="mt-1 text-[10px] text-red-500">{visibleTargetError}</p>
          )}
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-stone-500">备注</span>
          <textarea
            rows={2}
            value={comment}
            disabled={isSubmitting}
            onChange={(event) => setComment(event.target.value)}
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
