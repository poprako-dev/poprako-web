import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Plus,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { TermInfo } from "@/types/term";
import type { UpdateTermArgs } from "@/features/BaseTranslator/types/terminology";
import { AppDialogAction } from "@/components/ui/AppDialog";
import { moveTermTarget, validateTermTargets } from "../../hook/termForm";
import TerminologyDialogFrame from "./TerminologyDialogFrame";

interface Props {
  term?: TermInfo | undefined;
  onSave: (args: UpdateTermArgs) => Promise<boolean>;
  onDelete?: (() => Promise<boolean>) | undefined;
  onClose: () => void;
}

export default function TermEditorDialog({
  term,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [source, setSource] = useState(term?.source ?? "");
  const [targets, setTargets] = useState(() => (
    term && term.targets.length > 0 ? term.targets : [""]
  ).map((value) => ({ id: crypto.randomUUID(), value })));
  const [comment, setComment] = useState(term?.comment ?? "");
  const [hasTouchedTargets, setHasTouchedTargets] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = term !== undefined;

  const targetError = useMemo(
    () => validateTermTargets(targets.map((target) => target.value)),
    [targets],
  );
  const visibleTargetError = hasTouchedTargets ? targetError : undefined;
  const isValid = source.trim().length > 0 && !targetError;

  function handleTargetChange(id: string, value: string) {
    setHasTouchedTargets(true);
    setTargets((current) => current.map((target) => (
      target.id === id ? { ...target, value } : target
    )));
  }

  function handleAddTarget() {
    const target = { id: crypto.randomUUID(), value: "" };
    setTargets((current) => [...current, target]);
  }

  const handleSave = async () => {
    if (!isValid || isSubmitting) {return;}
    setIsSubmitting(true);
    const isSuccess = await onSave({
      source: source.trim(),
      targets: targets.map((target) => target.value.trim()),
      comment: comment.trim() || undefined,
    });
    setIsSubmitting(false);
    if (isSuccess) {onClose();}
  };

  const handleDelete = async () => {
    if (!onDelete || isSubmitting) {return;}
    setIsSubmitting(true);
    const isSuccess = await onDelete();
    setIsSubmitting(false);
    if (isSuccess) {onClose();}
  };

  if (isConfirmingDelete && term && onDelete) {
    return (
      <TerminologyDialogFrame
        title="删除术语"
        locked={isSubmitting}
        onClose={onClose}
        footer={(
          <div className="flex gap-2">
            <AppDialogAction
              type="button"
              disabled={isSubmitting}
              onClick={() => { setIsConfirmingDelete(false); }}
            >
              返回
            </AppDialogAction>
            <AppDialogAction
              type="button"
              tone="danger"
              disabled={isSubmitting}
              onClick={() => { void handleDelete(); }}
            >
              {isSubmitting && <LoaderCircle size={13} className="animate-spin" />}
              确认删除
            </AppDialogAction>
          </div>
        )}
      >
        <div className="rounded-md border border-red-100 bg-red-50/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-700">{term.source}</p>
          <p className="mt-1 text-xs leading-relaxed text-red-500">
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
            <AppDialogAction
              type="button"
              tone="danger"
              disabled={isSubmitting}
              onClick={() => { setIsConfirmingDelete(true); }}
            >
              删除
            </AppDialogAction>
          )}
          <AppDialogAction
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            取消
          </AppDialogAction>
          <AppDialogAction
            type="button"
            tone="brand"
            disabled={!isValid || isSubmitting}
            onClick={() => { void handleSave(); }}
          >
            {isSubmitting && <LoaderCircle size={13} className="animate-spin" />}
            保存
          </AppDialogAction>
        </div>
      )}
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">原文</span>
          <input
            value={source}
            disabled={isSubmitting}
            onChange={(event) => { setSource(event.target.value); }}
            className={clsx(
              "h-8 w-full rounded-md border border-slate-200 bg-white px-2.5",
              "text-sm text-slate-700 shadow-sm shadow-slate-100 outline-none",
              "transition-colors focus:border-slate-300",
            )}
          />
        </label>

        <fieldset>
          <div className="mb-1 flex items-center justify-between">
            <legend className="text-xs font-medium text-slate-500">译名</legend>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAddTarget}
              className={clsx(
                "flex h-6 items-center gap-1 rounded-md px-1.5",
                "text-[10px] text-slate-400 hover:bg-green-50 hover:text-green-600",
              )}
            >
              <Plus size={11} />
              添加译名
            </button>
          </div>
          <div className="space-y-1.5">
            {targets.map((target, index) => (
              <div key={target.id} className="flex items-center gap-1">
                <input
                  aria-label={`译名 ${String(index + 1)}`}
                  value={target.value}
                  disabled={isSubmitting}
                  onChange={(event) => { handleTargetChange(target.id, event.target.value); }}
                  onBlur={() => { setHasTouchedTargets(true); }}
                  className={clsx(
                    "h-8 min-w-0 flex-1 rounded-md border bg-white px-2.5",
                    "text-sm text-slate-700 shadow-sm shadow-slate-100 outline-none",
                    visibleTargetError && target.value.trim().length === 0
                      ? "border-red-200"
                      : "border-slate-200 focus:border-slate-300",
                  )}
                />
                <button
                  type="button"
                  aria-label={`上移译名 ${String(index + 1)}`}
                  disabled={isSubmitting || index === 0}
                  onClick={() => { setTargets((current) => (
                    moveTermTarget(current, index, index - 1)
                  )); }}
                  className={clsx(
                    "flex size-7 items-center justify-center rounded-md text-slate-400",
                    "hover:bg-slate-50 hover:text-slate-600",
                    "disabled:opacity-20",
                  )}
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  aria-label={`下移译名 ${String(index + 1)}`}
                  disabled={isSubmitting || index === targets.length - 1}
                  onClick={() => { setTargets((current) => (
                    moveTermTarget(current, index, index + 1)
                  )); }}
                  className={clsx(
                    "flex size-7 items-center justify-center rounded-md text-slate-400",
                    "hover:bg-slate-50 hover:text-slate-600",
                    "disabled:opacity-20",
                  )}
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  aria-label={`删除译名 ${String(index + 1)}`}
                  disabled={isSubmitting || targets.length === 1}
                  onClick={() => { setTargets((current) => (
                    current.filter((item) => item.id !== target.id)
                  )); }}
                  className={clsx(
                    "flex size-7 items-center justify-center rounded-md text-slate-400",
                    "hover:bg-red-50 hover:text-red-500 disabled:opacity-20",
                  )}
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
          <span className="mb-1 block text-xs font-medium text-slate-500">备注</span>
          <textarea
            rows={2}
            value={comment}
            disabled={isSubmitting}
            onChange={(event) => { setComment(event.target.value); }}
            placeholder="选填"
            className={clsx(
              "w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2",
              "text-sm leading-relaxed text-slate-700 shadow-sm shadow-slate-100",
              "outline-none placeholder:text-slate-300 focus:border-slate-300",
            )}
          />
        </label>
      </div>
    </TerminologyDialogFrame>
  );
}
