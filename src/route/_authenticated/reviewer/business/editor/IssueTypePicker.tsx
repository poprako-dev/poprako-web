import { useRef, useState } from "react";
import type { JSX } from "react";
import { ChevronDown, Plus, RotateCcw } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { issueAppearance } from "../issue/issue-appearance";
import { ISSUE_TYPES } from "./issue-types";
import { IssueTypeDialog, type CategoryAction } from "./IssueTypeDialog";
import { IssueTypeOptions, categoryItemClass } from "./IssueTypeOptions";
import type { IssueTypes } from "./use-issue-types";

type Props = {
  value: string;
  number: number;
  categories: IssueTypes;
  disabled: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
};

export function IssueTypePicker(props: Props): JSX.Element {
  const [action, setAction] = useState<CategoryAction | null>(null);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const appearance = issueAppearance(props.value);
  const customTypes = props.categories.types.filter(
    (type) => type.trim() && !ISSUE_TYPES.includes(type),
  );
  return (
    <>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            disabled={props.disabled}
            onFocus={props.onFocus}
            title={`选择分类：${props.value}`}
            aria-label={`标注 ${String(props.number)} 分类`}
            className="flex max-w-full items-center gap-1.5 rounded-sm border border-line-stone-200 bg-surface-stone-50 px-2 py-1 text-xs text-ink-stone-700 transition-colors hover:bg-surface-stone-200 disabled:opacity-40"
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: appearance.color }}
            />
            <span className="truncate">{props.value}</span>
            <ChevronDown size={12} className="shrink-0" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            collisionPadding={8}
            aria-label="标注分类"
            data-workbench-shortcuts="ignore"
            onCloseAutoFocus={(event) => {
              if (action) event.preventDefault();
            }}
            className="z-100 w-44 max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto rounded-md border border-line-stone-200 bg-surface-stone-50 p-1 text-ink-stone-600 shadow-md"
          >
            {props.categories.error && (
              <DropdownMenu.Item
                title={props.categories.error}
                aria-label="重试加载分类"
                className={categoryItemClass}
                onSelect={(event) => {
                  event.preventDefault();
                  props.categories.retry();
                }}
              >
                <RotateCcw size={14} />
              </DropdownMenu.Item>
            )}
            <DropdownMenu.RadioGroup value={props.value} onValueChange={props.onChange}>
              <DropdownMenu.Label
                title="默认分类"
                className="px-3 py-1 text-[11px] text-text-muted-warm"
              >
                默认分类
              </DropdownMenu.Label>
              <IssueTypeOptions types={ISSUE_TYPES} />
              {customTypes.length > 0 && (
                <>
                  <DropdownMenu.Separator className="my-1 h-px bg-line-stone-200" />
                  <DropdownMenu.Label
                    title="自定义分类"
                    className="px-3 py-1 text-[11px] text-text-muted-warm"
                  >
                    自定义分类
                  </DropdownMenu.Label>
                  <IssueTypeOptions
                    types={customTypes}
                    categories={props.categories}
                    onEdit={(type) => {
                      setOpen(false);
                      setAction({ kind: "rename", type });
                    }}
                    onDelete={(type) => {
                      setAction({ kind: "delete", type });
                    }}
                  />
                </>
              )}
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Separator className="my-1 h-px bg-line-stone-200" />
            <DropdownMenu.Item
              title="自定义分类"
              className={categoryItemClass}
              onSelect={() => {
                setAction({ kind: "create" });
              }}
            >
              自定义分类…
              <Plus size={14} className="ml-auto" />
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {action && (
        <IssueTypeDialog
          action={action}
          categories={props.categories}
          disabled={props.disabled}
          onChange={props.onChange}
          onClose={() => {
            setAction(null);
            triggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
