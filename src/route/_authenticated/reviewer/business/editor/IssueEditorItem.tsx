import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { ScanLine, Trash2, Unlink } from "lucide-react";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import { WorkbenchItemFrame } from "@/shared/component/WorkbenchItemFrame";
import { AutoResizeTextarea } from "@/shared/component/AutoResizeTextarea";
import { issueAppearance } from "../issue/issue-appearance";
import { IssueTypePicker } from "./IssueTypePicker";
import type { IssueTypes } from "./use-issue-types";
import clsx from "clsx";

type Props = {
  issue: IssueInfo;
  selected: boolean;
  focusInput: boolean;
  disabled: boolean;
  canDraw: boolean;
  drawing: boolean;
  categories: IssueTypes;
  onSelect: () => void;
  onChange: (patch: Partial<Pick<IssueInfo, "note" | "variant" | "rect">>) => void;
  onDelete: () => void;
  onRedraw: () => void;
};

export function IssueEditorItem(props: Props): JSX.Element {
  const { issue, selected, focusInput, disabled, onSelect, onChange } = props;
  const appearance = issueAppearance(issue.variant);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (focusInput && !disabled) inputRef.current?.focus();
  }, [focusInput, disabled]);
  return (
    <WorkbenchItemFrame
      isFocused={selected}
      data-issue-id={issue.id}
      leading={
        <>
          <div
            className="shrink-0 border-l-4"
            style={{ borderColor: appearance.color }}
            title={issue.variant}
          />
          <button
            type="button"
            title={issue.variant}
            aria-label={`标注 ${String(issue.index + 1)}：${issue.variant}`}
            aria-pressed={selected}
            onClick={onSelect}
            className="flex w-8 shrink-0 items-center justify-center font-mono text-xs font-bold text-ink-stone-600 hover:bg-surface-stone-200/70"
          >
            {issue.index + 1}
          </button>
        </>
      }
    >
      <div className="mb-1 flex min-w-0 items-center gap-2">
        <IssueTypePicker
          value={issue.variant}
          number={issue.index + 1}
          categories={props.categories}
          disabled={disabled}
          onFocus={onSelect}
          onChange={(variant) => {
            onChange({ variant });
          }}
        />
      </div>
      <AutoResizeTextarea
        ref={inputRef}
        label={`标注 ${String(issue.index + 1)} 说明`}
        value={issue.note}
        onChange={(note) => {
          onChange({ note });
        }}
        onFocus={onSelect}
        readOnly={disabled}
        placeholder="填写问题说明…"
        className="text-base leading-relaxed text-ink-stone-800 placeholder:text-text-muted-neutral/40"
      />
      {selected && <IssueItemActions {...props} />}
    </WorkbenchItemFrame>
  );
}

function IssueItemActions({
  issue,
  disabled,
  canDraw,
  drawing,
  onChange,
  onRedraw,
  onDelete,
}: Pick<
  Props,
  "issue" | "disabled" | "canDraw" | "drawing" | "onChange" | "onRedraw" | "onDelete"
>): JSX.Element {
  const actions = [
    {
      label: drawing ? "取消框选" : issue.rect ? "重新框选" : "添加区域",
      icon: ScanLine,
      active: drawing,
      run: onRedraw,
      unavailable: !canDraw,
    },
    ...(issue.rect
      ? [
          {
            label: "移除区域",
            icon: Unlink,
            run: () => {
              onChange({ rect: null });
            },
          },
        ]
      : []),
    { label: "删除标注", icon: Trash2, run: onDelete },
  ];
  return (
    <div className="mt-2 flex justify-end gap-1 border-t border-line-stone-200 pt-1">
      {actions.map(({ label, icon: Icon, run, unavailable, active }) => (
        <button
          key={label}
          type="button"
          title={active ? "正在框选 · 点击取消" : label}
          aria-pressed={active}
          aria-label={label}
          disabled={disabled || unavailable}
          onClick={run}
          className={clsx(
            "flex items-center gap-1 rounded p-1.5 text-xs disabled:opacity-40",
            active
              ? "bg-surface-green-50 text-ink-green-800"
              : "text-ink-stone-600 hover:bg-surface-stone-200/70",
          )}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
