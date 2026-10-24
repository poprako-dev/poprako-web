import type { JSX } from "react";
import { Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { IssueTypes } from "./use-issue-types";
import { IssueTypeOption } from "./IssueTypeOption";

export const categoryItemClass =
  "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-xs outline-none data-highlighted:bg-surface-stone-200 data-disabled:opacity-40";

type Props = {
  types: string[];
  categories?: IssueTypes;
  onEdit?: (type: string) => void;
  onDelete?: (type: string) => void;
};

export function IssueTypeOptions({ types, categories, onEdit, onDelete }: Props): JSX.Element {
  return (
    <>
      {types.map((type) => (
        <div key={type} className="flex items-center">
          <IssueTypeOption
            type={type}
            editable={Boolean(categories && !categories.loading)}
            onEdit={(value) => {
              onEdit?.(value);
            }}
          />
          {categories && (
            <DropdownMenu.Item
              title={
                categories.count(type) > 0
                  ? `被 ${String(categories.count(type))} 条标注引用，不能删除`
                  : categories.loading
                    ? "正在加载分类引用"
                    : `删除分类：${type}`
              }
              aria-label={`删除分类：${type}`}
              disabled={categories.loading || categories.count(type) > 0}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-muted-warm outline-none data-highlighted:bg-surface-red-50 data-highlighted:text-text-danger data-disabled:opacity-40"
              onSelect={() => {
                onDelete?.(type);
              }}
            >
              <Trash2 size={14} />
            </DropdownMenu.Item>
          )}
        </div>
      ))}
    </>
  );
}
