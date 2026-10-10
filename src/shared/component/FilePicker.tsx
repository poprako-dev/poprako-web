import { useRef, useState, type JSX, type ReactNode } from "react";
import clsx from "clsx";

type Props = {
  inputLabel: string;
  buttonLabel: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  children: ReactNode;
  onSelect: (files: File[]) => void;
};

export function FilePicker({
  inputLabel,
  buttonLabel,
  accept,
  multiple = false,
  disabled = false,
  invalid = false,
  children,
  onSelect,
}: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        aria-label={inputLabel}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) onSelect(files);
        }}
      />
      <button
        type="button"
        aria-label={buttonLabel}
        disabled={disabled}
        onClick={() => {
          inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          const files = [...event.dataTransfer.files];
          if (files.length > 0) onSelect(files);
        }}
        className={clsx(
          "flex min-h-24 w-full items-center justify-center gap-3 rounded-lg border border-dashed px-4 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-50",
          invalid
            ? "border-(--danger-border) bg-surface-red-50 text-text-danger"
            : dragging
              ? "border-(--brand-leaf-border) bg-surface-green-50 text-text-muted-cool"
              : "border-line-stone-200 bg-surface-stone-50/60 text-text-muted-cool",
          !disabled && "hover:border-(--brand-leaf-border) hover:bg-surface-green-50",
        )}
      >
        {children}
      </button>
    </>
  );
}
