import { type JSX, useId, useState } from "react";
import clsx from "clsx";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import type {
  ImportChapterFormat,
  ImportChapterMode,
  ImportChapterTarget,
} from "@/route/_authenticated/business/chapter/chapter-input";
import {
  defaultImportTarget,
  importDialogTitle,
  resolveImportTargets,
  type ImportTargetOption,
} from "@/route/_authenticated/_shell/business/comic-detail/import-target";

type Props = {
  fileName: string;
  format: ImportChapterFormat;
  canTranslate: boolean;
  canProofread: boolean;
  loading: boolean;
  onConfirm: (mode: ImportChapterMode, target: ImportChapterTarget) => void;
  onCancel: () => void;
};

type TargetSwitchProps = {
  options: ImportTargetOption[];
  target: ImportChapterTarget;
  disabled: boolean;
  onChange: (target: ImportChapterTarget) => void;
};

function ImportTargetSwitch({
  options,
  target,
  disabled,
  onChange,
}: TargetSwitchProps): JSX.Element {
  return (
    <div role="group" aria-label="导入目标" className="flex rounded-sm bg-surface-stone-100 p-0.5">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={target === value}
          disabled={disabled}
          onClick={() => {
            onChange(value);
          }}
          className={clsx(
            "flex flex-1 items-center justify-center rounded-xs px-2 py-1",
            "text-[11px] transition-colors duration-150",
            "disabled:cursor-not-allowed disabled:opacity-40",
            target === value
              ? "bg-surface-white text-ink-gray-800 shadow-(--shadow-sm)"
              : "text-ink-slate-500 hover:text-ink-slate-700",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type ModeOptionProps = {
  inputId: string;
  value: ImportChapterMode;
  checked: boolean;
  title: string;
  description: string;
  onChange: (mode: ImportChapterMode) => void;
};

function ImportModeOption({
  inputId,
  value,
  checked,
  title,
  description,
  onChange,
}: ModeOptionProps): JSX.Element {
  return (
    <label
      htmlFor={inputId}
      aria-label={title}
      className="flex cursor-pointer items-start gap-3 text-sm"
    >
      <input
        id={inputId}
        type="radio"
        name="translation-import-mode"
        value={value}
        checked={checked}
        onChange={() => {
          onChange(value);
        }}
        className="mt-1 accent-primary"
      />
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-1 block text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function ImportTranslationDialog({
  fileName,
  format,
  canTranslate,
  canProofread,
  loading,
  onConfirm,
  onCancel,
}: Props): JSX.Element {
  const [mode, setMode] = useState<ImportChapterMode>("keep");
  const inputId = useId();
  const options = resolveImportTargets({ canTranslate, canProofread, format });
  const [target, setTarget] = useState<ImportChapterTarget>(() => defaultImportTarget(options));

  return (
    <ConfirmDialog
      title={importDialogTitle(options)}
      description={`文件：${fileName}`}
      confirmLabel="确认导入"
      confirmTone={mode === "overwrite" ? "danger" : "success"}
      confirmDisabled={options.length === 0}
      loading={loading}
      onConfirm={() => {
        onConfirm(mode, target);
      }}
      onCancel={() => {
        if (!loading) {
          onCancel();
        }
      }}
    >
      <fieldset disabled={loading} className="space-y-4 px-5 py-4">
        <legend className="sr-only">导入设置</legend>
        {options.length > 1 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-slate-500">导入到</span>
            <ImportTargetSwitch
              options={options}
              target={target}
              disabled={loading}
              onChange={setTarget}
            />
          </div>
        )}
        <ImportModeOption
          inputId={`${inputId}-keep`}
          value="keep"
          checked={mode === "keep"}
          title="保留已有内容"
          description="跳过已有翻校内容的页面，仅导入空白页面。"
          onChange={setMode}
        />
        <ImportModeOption
          inputId={`${inputId}-overwrite`}
          value="overwrite"
          checked={mode === "overwrite"}
          title="覆盖已有内容"
          description="用文件内容替换匹配页面的已有翻校内容。"
          onChange={setMode}
        />
      </fieldset>
    </ConfirmDialog>
  );
}
