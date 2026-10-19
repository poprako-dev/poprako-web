import clsx from "clsx";
import { useLongPress } from "@/shared/hook/use-long-press";
import type { TermbaseInfo } from "./termbase";
import { TermbaseShareButton } from "./TermbaseShareButton";

type Props = {
  termbase: TermbaseInfo;
  isSelected: boolean;
  isExporting: boolean;
  onSelect: () => void;
  onExport: () => void;
  onEdit?: () => void;
};

export function TermbaseRow({
  termbase,
  isSelected,
  isExporting,
  onSelect,
  onExport,
  onEdit,
}: Props): React.ReactElement {
  const scope = termbase.comicId ? "本作" : "团队";
  const longPress = useLongPress({ onLongPress: () => onEdit?.(), onClick: onSelect });

  return (
    <div
      role="listitem"
      className={clsx(
        "flex min-h-7 items-center gap-3 pr-2.5",
        "border-b border-line-stone-200/55 last:border-b-0",
        "transition-colors hover:bg-surface-stone-50",
        isSelected && "bg-surface-green-50",
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        {...(onEdit ? longPress : {})}
        onPointerLeave={onEdit ? longPress.onPointerCancel : undefined}
        onClick={(event) => {
          if (!onEdit || event.detail === 0) onSelect();
        }}
        title={onEdit ? "长按编辑术语库" : undefined}
        className={clsx(
          "flex min-h-7 min-w-0 flex-1 items-center gap-3 py-1 pl-2.5 text-left",
          "focus-visible:outline-2 focus-visible:outline-primary-border",
          onEdit && "touch-none select-none",
        )}
      >
        <span className="flex min-w-0 max-w-[68%] items-center gap-1.5">
          <span className="min-w-0 truncate text-xs font-medium text-ink-stone-700">
            {termbase.name}
          </span>
          <span
            className={clsx(
              "shrink-0 border-l border-line-stone-200 pl-1.5",
              "text-[10px] tabular-nums text-text-muted-warm",
            )}
          >
            {termbase.termCount} 条
          </span>
          <span
            className={clsx(
              "shrink-0 rounded-md border px-1 py-px",
              "text-[9px] font-medium leading-none",
              termbase.comicId
                ? "border-line-green-100 bg-surface-green-50 text-ink-stone-600"
                : "border-line-stone-200 bg-surface-stone-50 text-text-muted-warm",
            )}
          >
            {scope}
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-[10px] text-text-muted-warm">
          {termbase.description ?? "暂无描述"}
        </span>
      </button>
      <TermbaseShareButton isExporting={isExporting} onExport={onExport} />
    </div>
  );
}
