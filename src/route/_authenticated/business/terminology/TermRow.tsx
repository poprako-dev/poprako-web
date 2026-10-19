import clsx from "clsx";
import { useLongPress } from "@/shared/hook/use-long-press";
import type { TermInfo } from "./term";
import { TermCopyButton } from "./TermCopyButton";

type Props = {
  term: TermInfo;
  onEdit?: () => void;
  directory?: boolean;
};

export function TermRow({ term, onEdit, directory = false }: Props): React.ReactElement {
  const longPress = useLongPress({ onLongPress: () => onEdit?.() });

  return (
    <div
      role="listitem"
      {...(onEdit ? longPress : {})}
      onPointerLeave={onEdit ? longPress.onPointerCancel : undefined}
      title={onEdit ? "长按编辑术语" : term.comment}
      className={clsx(
        "flex items-center border-b border-line-stone-200/55",
        "last:border-b-0 transition-colors hover:bg-surface-stone-50",
        directory ? "min-h-11 gap-2 py-2 pl-8 pr-2.5" : "min-h-8 gap-3 px-2.5 py-1",
        onEdit ? "select-none cursor-pointer" : "select-text",
        onEdit && (directory ? "touch-pan-y" : "touch-none"),
      )}
    >
      {directory && (
        <span aria-hidden="true" className="flex w-4 shrink-0 items-center justify-center">
          <span className="size-1.5 rounded-full bg-(--brand-leaf)" />
        </span>
      )}
      <p
        className={clsx(
          "min-w-0 flex-1 truncate text-ink-stone-700",
          directory ? "text-sm font-medium" : "text-xs font-semibold",
        )}
      >
        {term.source}
      </p>
      <div
        className={clsx(
          "flex flex-wrap justify-end gap-1",
          directory ? "max-w-[50%]" : "max-w-[68%]",
        )}
      >
        {term.targets.length > 0 ? (
          term.targets.map((target, index) => (
            <div
              key={`${term.id}:${target}:${String(index)}`}
              className={clsx(
                "rounded-md border border-line-green-100 bg-surface-green-50/60 px-1.5 py-px",
                "leading-4 text-primary-text",
                directory ? "text-xs" : "text-[10px]",
              )}
            >
              {target}
            </div>
          ))
        ) : (
          <span className="text-[11px] text-text-muted-warm">暂无译名</span>
        )}
      </div>
      <TermCopyButton target={term.targets[0]} />
    </div>
  );
}
