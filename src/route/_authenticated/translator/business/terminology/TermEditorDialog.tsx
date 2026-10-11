import type { JSX } from "react/jsx-runtime";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, Plus, X } from "lucide-react";
import clsx from "clsx";
import type { TermInfo } from "@/route/_authenticated/translator/business/terminology/term";
import type { UpdateTermArgs } from "@/route/_authenticated/translator/business/contract/terminology";
import { AppDialogAction } from "@/shared/component/AppDialog";
import {
  moveTermTarget,
  validateTermTargets,
} from "@/route/_authenticated/translator/business/terminology/term-form";
import { TerminologyDialogFrame } from "@/route/_authenticated/translator/business/terminology/TerminologyDialogFrame";

type Props = {
  term?: TermInfo | undefined;
  onSave: (args: UpdateTermArgs) => Promise<boolean>;
  onDelete?: (() => Promise<boolean>) | undefined;
  onClose: () => void;
};

type TargetDraft = { id: string; value: string };
type SetTargetDrafts = Dispatch<SetStateAction<TargetDraft[]>>;

type TermTargetRowsProps = {
  targets: TargetDraft[];
  isSubmitting: boolean;
  visibleTargetError: string | undefined;
  onAdd: () => void;
  onChange: (id: string, value: string) => void;
  onBlur: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
};

type TermTargetRowProps = {
  target: TargetDraft;
  index: number;
  targetCount: number;
  isSubmitting: boolean;
  visibleTargetError: string | undefined;
  onChange: (id: string, value: string) => void;
  onBlur: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
};

function TermTargetRow(props: TermTargetRowProps): JSX.Element {
  const {
    target,
    index,
    targetCount,
    isSubmitting,
    visibleTargetError,
    onChange,
    onBlur,
    onMove,
    onRemove,
  } = props;
  return (
    <div className="flex items-center gap-1">
      <input
        aria-label={`译名 ${String(index + 1)}`}
        value={target.value}
        disabled={isSubmitting}
        onChange={(event) => {
          onChange(target.id, event.target.value);
        }}
        onBlur={onBlur}
        className={clsx(
          "h-8 min-w-0 flex-1 rounded-md border bg-surface-white px-2.5",
          "text-sm text-ink-slate-700 shadow-sm shadow-shadow-slate-100 outline-none",
          visibleTargetError && target.value.trim().length === 0
            ? "border-control-error focus:border-control-error"
            : "border-control-border focus:border-line-slate-300",
        )}
      />
      <button
        type="button"
        aria-label={`上移译名 ${String(index + 1)}`}
        disabled={isSubmitting || index === 0}
        onClick={() => {
          onMove(index, -1);
        }}
        className={clsx(
          "flex size-7 items-center justify-center rounded-md text-text-muted-cool",
          "hover:bg-surface-slate-50 hover:text-ink-slate-600",
          "disabled:opacity-20",
        )}
      >
        <ChevronUp size={13} />
      </button>
      <button
        type="button"
        aria-label={`下移译名 ${String(index + 1)}`}
        disabled={isSubmitting || index === targetCount - 1}
        onClick={() => {
          onMove(index, 1);
        }}
        className={clsx(
          "flex size-7 items-center justify-center rounded-md text-text-muted-cool",
          "hover:bg-surface-slate-50 hover:text-ink-slate-600",
          "disabled:opacity-20",
        )}
      >
        <ChevronDown size={13} />
      </button>
      <button
        type="button"
        aria-label={`删除译名 ${String(index + 1)}`}
        disabled={isSubmitting || targetCount === 1}
        onClick={() => {
          onRemove(target.id);
        }}
        className={clsx(
          "flex size-7 items-center justify-center rounded-md text-text-muted-cool",
          "hover:bg-surface-red-50 hover:text-text-danger disabled:opacity-20",
        )}
      >
        <X size={13} />
      </button>
    </div>
  );
}

function TermTargetRows(props: TermTargetRowsProps): JSX.Element {
  const { targets, isSubmitting, visibleTargetError, onAdd, onChange, onBlur, onMove, onRemove } =
    props;
  return (
    <fieldset>
      <div className="mb-1 flex items-center justify-between">
        <legend className="text-xs font-medium text-ink-slate-500">译名</legend>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onAdd}
          className={clsx(
            "flex h-6 items-center gap-1 rounded-md px-1.5",
            "text-[10px] text-text-muted-cool hover:bg-surface-green-50 hover:text-text-green",
          )}
        >
          <Plus size={11} />
          添加译名
        </button>
      </div>
      <div className="space-y-1.5">
        {targets.map((target, index) => (
          <TermTargetRow
            key={target.id}
            target={target}
            index={index}
            targetCount={targets.length}
            isSubmitting={isSubmitting}
            visibleTargetError={visibleTargetError}
            onChange={onChange}
            onBlur={onBlur}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </div>
      {visibleTargetError && (
        <p className="mt-1 text-[10px] text-text-danger">{visibleTargetError}</p>
      )}
    </fieldset>
  );
}

function changeTermTarget(
  id: string,
  value: string,
  setTargets: SetTargetDrafts,
  setHasTouchedTargets: (value: boolean) => void,
): void {
  setHasTouchedTargets(true);
  setTargets((current) =>
    current.map((target) => (target.id === id ? { ...target, value } : target)),
  );
}

function addTermTarget(setTargets: SetTargetDrafts): void {
  setTargets((current) => [...current, { id: crypto.randomUUID(), value: "" }]);
}

async function saveTermChanges(options: {
  isValid: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onSave: Props["onSave"];
  onClose: Props["onClose"];
  source: string;
  targets: TargetDraft[];
  comment: string;
}): Promise<void> {
  if (!options.isValid || options.isSubmitting) return;
  options.setIsSubmitting(true);
  const isSuccess = await options.onSave({
    source: options.source.trim(),
    targets: options.targets.map((target) => target.value.trim()),
    comment: options.comment.trim() || undefined,
  });
  options.setIsSubmitting(false);
  if (isSuccess) options.onClose();
}

async function deleteTerm(options: {
  onDelete: Props["onDelete"];
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onClose: Props["onClose"];
}): Promise<void> {
  if (!options.onDelete || options.isSubmitting) return;
  options.setIsSubmitting(true);
  const isSuccess = await options.onDelete();
  options.setIsSubmitting(false);
  if (isSuccess) options.onClose();
}

export function TermEditorDialog({ term, onSave, onDelete, onClose }: Props): JSX.Element {
  const [source, setSource] = useState(term?.source ?? "");
  const [targets, setTargets] = useState<TargetDraft[]>(() =>
    (term && term.targets.length > 0 ? term.targets : [""]).map((value) => ({
      id: crypto.randomUUID(),
      value,
    })),
  );
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

  const handleTargetChange = (id: string, value: string): void => {
    changeTermTarget(id, value, setTargets, setHasTouchedTargets);
  };
  const handleAddTarget = (): void => {
    addTermTarget(setTargets);
  };
  const handleSave = (): Promise<void> =>
    saveTermChanges({
      isValid,
      isSubmitting,
      setIsSubmitting,
      onSave,
      onClose,
      source,
      targets,
      comment,
    });
  const handleDelete = (): Promise<void> =>
    deleteTerm({ onDelete, isSubmitting, setIsSubmitting, onClose });

  if (isConfirmingDelete && term && onDelete) {
    return (
      <TerminologyDialogFrame
        title="删除术语"
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
          <p className="text-sm font-semibold text-ink-slate-700">{term.source}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-danger">
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
          <span className="mb-1 block text-xs font-medium text-ink-slate-500">原文</span>
          <input
            value={source}
            disabled={isSubmitting}
            onChange={(event) => {
              setSource(event.target.value);
            }}
            className={clsx(
              "h-8 w-full rounded-md border border-control-border bg-surface-white px-2.5",
              "text-sm text-ink-slate-700 shadow-sm shadow-shadow-slate-100 outline-none",
              "transition-colors focus:border-line-slate-300",
            )}
          />
        </label>

        <TermTargetRows
          targets={targets}
          isSubmitting={isSubmitting}
          visibleTargetError={visibleTargetError}
          onAdd={handleAddTarget}
          onChange={handleTargetChange}
          onBlur={() => {
            setHasTouchedTargets(true);
          }}
          onMove={(index, direction) => {
            setTargets((current) => moveTermTarget(current, index, index + direction));
          }}
          onRemove={(id) => {
            setTargets((current) => current.filter((item) => item.id !== id));
          }}
        />

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-slate-500">备注</span>
          <textarea
            rows={2}
            value={comment}
            disabled={isSubmitting}
            onChange={(event) => {
              setComment(event.target.value);
            }}
            placeholder="选填"
            className={clsx(
              "w-full resize-none rounded-md border border-control-border bg-surface-white px-2.5 py-2",
              "text-sm leading-relaxed text-ink-slate-700 shadow-sm shadow-shadow-slate-100",
              "outline-none placeholder:text-text-muted-cool focus:border-line-slate-300",
            )}
          />
        </label>
      </div>
    </TerminologyDialogFrame>
  );
}
