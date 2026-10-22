import type { JSX } from "react";
import clsx from "clsx";

type Props = {
  complete: boolean;
  hasLocalDraft?: boolean | undefined;
};

export function UnitProgressIndicator({ complete, hasLocalDraft }: Props): JSX.Element {
  return (
    <div className="shrink-0 w-7 h-7 p-1 rounded flex items-center justify-center">
      <div
        data-unit-progress
        role={hasLocalDraft ? "img" : undefined}
        aria-label={hasLocalDraft ? "有未保存草稿" : undefined}
        title={hasLocalDraft ? "有未保存草稿" : undefined}
        className={clsx(
          "size-2.5 rounded-full",
          hasLocalDraft ? "border-[2.5px] border-current" : "bg-current",
          complete ? "text-[var(--brand-leaf)]" : "text-[var(--surface-gray-200)]",
        )}
      />
    </div>
  );
}
