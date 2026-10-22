import { useRef, type ReactElement } from "react";
import { ListPlus } from "lucide-react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";

type Props = {
  name: string;
  busy: boolean;
  disabled: boolean;
  onAppend: (file: File) => void;
};

export function TermbaseAppendButton({ name, busy, disabled, onAppend }: Props): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        aria-label={`向${name}追加术语 JSON 文件`}
        accept=".json,application/json"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file && !disabled) onAppend(file);
        }}
      />
      <button
        type="button"
        aria-label="追加术语"
        title="追加术语"
        aria-busy={busy}
        disabled={disabled}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
        className={clsx(
          "flex size-5 shrink-0 items-center justify-center rounded-sm border",
          "border-line-stone-200 bg-surface-white text-text-muted-warm transition-colors",
          "enabled:hover:border-line-green-100 enabled:hover:bg-surface-green-50",
          "enabled:hover:text-ink-stone-700 disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:outline-2 focus-visible:outline-primary-border",
        )}
      >
        {busy ? (
          <LoadingCircle size={12} aria-label="正在追加术语" />
        ) : (
          <ListPlus size={12} aria-hidden="true" />
        )}
      </button>
    </>
  );
}
