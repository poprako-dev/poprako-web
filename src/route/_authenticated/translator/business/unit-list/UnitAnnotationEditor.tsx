import type { JSX } from "react";
import { AutoResizeTextarea } from "./AutoResizeTextarea";

import type { UnitCommentField, UnitComments } from "../unit/unit-comments";

type Props = {
  id: string;
  expanded: boolean;
  values: UnitComments;
  readOnly?: boolean;
  onChange: (field: UnitCommentField, content: string | null) => void;
};

const fields = [
  {
    field: "translationComment",
    label: "翻译注释",
    placeholder: "可输入（供嵌字注释）",
  },
  { field: "supplementComment", label: "补充注释", placeholder: "可输入（仅翻校可见的注释）" },
] as const;

export function UnitAnnotationEditor({
  id,
  expanded,
  values,
  readOnly = false,
  onChange,
}: Props): JSX.Element {
  return (
    <div id={id} hidden={!expanded} data-workbench-shortcuts="ignore">
      <div className="mx-auto my-2 h-px w-4/5 bg-surface-gray-300" />
      <div className="flex flex-col gap-1">
        {fields.map(({ field, label, placeholder }) => (
          <label key={field} className="flex items-start gap-2">
            <span
              id={`unit-comment-${id}-${field}-label`}
              className="shrink-0 text-xs font-semibold italic leading-5 text-text-muted-neutral/80"
            >
              {label}
            </span>
            <div className="min-w-0 flex-1">
              <AutoResizeTextarea
                value={values[field] ?? ""}
                onChange={(content) => {
                  onChange(field, content === "" ? null : content);
                }}
                placeholder={placeholder}
                readOnly={readOnly}
                className="text-sm leading-5 text-ink-stone-600 placeholder:text-text-muted-neutral/40"
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
