import { useState } from "react";
import type { JSX } from "react";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { CustomIssueTypeDialog } from "./CustomIssueTypeDialog";
import type { IssueTypes } from "./use-issue-types";
import { message } from "./review-editing";

export type CategoryAction = { kind: "create" } | { kind: "rename" | "delete"; type: string };
type Props = {
  action: CategoryAction;
  categories: IssueTypes;
  disabled: boolean;
  onChange: (type: string) => void;
  onClose: () => void;
};

export function IssueTypeDialog({
  action,
  categories,
  disabled,
  onChange,
  onClose,
}: Props): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  async function remove(): Promise<void> {
    if (action.kind !== "delete") return;
    try {
      await categories.remove(action.type);
      onClose();
    } catch (cause) {
      setError(message(cause));
    }
  }
  if (action.kind !== "delete")
    return (
      <CustomIssueTypeDialog
        title={action.kind === "rename" ? "重命名分类" : "自定义分类"}
        initialValue={action.kind === "rename" ? action.type : ""}
        existingTypes={action.kind === "rename" ? categories.types : categories.presets}
        disabled={disabled || (action.kind === "rename" && categories.loading)}
        onApply={async (name) => {
          if (action.kind === "rename") await categories.rename(action.type, name);
          else {
            categories.add(name);
            onChange(name);
          }
        }}
        onClose={onClose}
      />
    );
  return (
    <ConfirmDialog
      title="删除分类"
      confirmLabel="删除"
      confirmDisabled={disabled || categories.loading || categories.count(action.type) > 0}
      onCancel={onClose}
      onConfirm={() => {
        void remove();
      }}
    >
      <p className="px-5 py-2 text-sm text-ink-slate-700 [overflow-wrap:anywhere]">{action.type}</p>
      {error && (
        <p role="alert" className="px-5 py-2 text-xs text-text-danger">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
