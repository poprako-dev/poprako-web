import { useRef, useState } from "react";
import type { JSX } from "react";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { isKeyboardComposing } from "@/shared/utility/keyboard";
import { message } from "./review-editing";

const EMPTY_TYPES: string[] = [];

type Props = {
  initialValue: string;
  title?: string;
  existingTypes?: string[];
  disabled: boolean;
  onApply: (value: string) => void | Promise<void>;
  onClose: () => void;
};

export function CustomIssueTypeDialog({
  initialValue,
  title = "自定义分类",
  existingTypes = EMPTY_TYPES,
  disabled,
  onApply,
  onClose,
}: Props): JSX.Element {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState<string | null>(null);
  const duplicate =
    value.trim() !== initialValue &&
    existingTypes.includes(value.trim()) &&
    !(error && attempted === value.trim());
  const inputRef = useRef<HTMLInputElement>(null);
  async function apply(): Promise<void> {
    if (disabled || pending || !value.trim() || duplicate) return;
    setPending(true);
    setAttempted(value.trim());
    try {
      await onApply(value.trim());
      onClose();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <AppDialog
      title={title}
      size="compact"
      onClose={() => {
        if (!pending) onClose();
      }}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        inputRef.current?.focus();
      }}
      footer={
        <div className="flex gap-2">
          <AppDialogAction title="取消" disabled={pending} onClick={onClose}>
            取消
          </AppDialogAction>
          <AppDialogAction
            title="应用分类"
            tone="brand"
            disabled={disabled || pending || !value.trim() || duplicate}
            onClick={() => {
              void apply();
            }}
          >
            应用
          </AppDialogAction>
        </div>
      }
    >
      <input
        ref={inputRef}
        type="text"
        aria-label="分类名称"
        title="分类名称"
        placeholder="分类名称"
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled || pending}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !isKeyboardComposing(event.nativeEvent)) {
            event.preventDefault();
            void apply();
          }
        }}
        className="h-8 w-full rounded-md border border-control-border bg-surface-white px-3 text-sm text-ink-slate-700 shadow-sm placeholder:text-text-muted-cool focus:outline-none"
      />
      {(duplicate || error) && (
        <p role="alert" className="mt-2 text-xs text-text-danger">
          {duplicate ? "分类名称已存在" : error}
        </p>
      )}
    </AppDialog>
  );
}
