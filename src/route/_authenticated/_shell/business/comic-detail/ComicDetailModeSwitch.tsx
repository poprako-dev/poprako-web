import type { JSX } from "react";
import { Switch } from "radix-ui";
import clsx from "clsx";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
type Props = { mode: ComicDetailMode; onChange: (mode: ComicDetailMode) => void };
export function ComicDetailModeSwitch({ mode, onChange }: Props): JSX.Element {
  return (
    <div className="mt-auto flex shrink-0 items-center justify-center gap-2 py-2 text-[10px] font-semibold">
      <button
        type="button"
        onClick={() => {
          onChange("translator");
        }}
        className={clsx(mode === "translator" ? "text-ink-stone-700" : "text-text-muted-warm")}
      >
        翻校
      </button>
      <Switch.Root
        aria-label="嵌监模式"
        checked={mode === "reviewer"}
        onCheckedChange={(checked) => {
          onChange(checked ? "reviewer" : "translator");
        }}
        className="relative h-4.5 w-8 rounded-full bg-surface-stone-200 transition-colors data-[state=checked]:bg-(--primary) focus-visible:outline-2 focus-visible:outline-primary/60"
      >
        <Switch.Thumb className="block size-3.5 translate-x-0.5 rounded-full bg-surface-white shadow-sm transition-transform data-[state=checked]:translate-x-4" />
      </Switch.Root>
      <button
        type="button"
        onClick={() => {
          onChange("reviewer");
        }}
        className={clsx(mode === "reviewer" ? "text-ink-stone-700" : "text-text-muted-warm")}
      >
        嵌监
      </button>
    </div>
  );
}
