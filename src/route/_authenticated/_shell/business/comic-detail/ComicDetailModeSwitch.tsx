import type { JSX } from "react";
import clsx from "clsx";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
type Props = { mode: ComicDetailMode; onChange: (mode: ComicDetailMode) => void };

const MODES: { value: ComicDetailMode; label: string }[] = [
  { value: "translator", label: "翻校" },
  { value: "reviewer", label: "嵌监" },
];

export function ComicDetailModeSwitch({ mode, onChange }: Props): JSX.Element {
  return (
    <div className="mt-auto shrink-0 py-2">
      <div
        role="group"
        aria-label="工作台模式"
        className="flex rounded-[3px] bg-surface-stone-100 p-0.5 shadow-inner"
      >
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => {
              onChange(value);
            }}
            className={clsx(
              "flex flex-1 items-center justify-center py-0.5",
              "text-[11px] transition-colors duration-150",
              "first:rounded-l-[2px] last:rounded-r-[2px]",
              mode === value
                ? "bg-role-active-emphasis text-ink-stone-700 font-semibold"
                : "text-text-muted-warm font-normal",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
