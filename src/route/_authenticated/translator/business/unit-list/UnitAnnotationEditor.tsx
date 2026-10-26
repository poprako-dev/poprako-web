import type { JSX } from "react";
import { AutoResizeTextarea } from "./AutoResizeTextarea";

import type { UnitNoteField, UnitNotes } from "../unit/unit-notes";

type Props = {
  id: string;
  values: UnitNotes;
  readOnly?: boolean;
  onChange: (field: UnitNoteField, content: string | null) => void;
};

const fields = [
  {
    field: "typographyNote",
    label: "嵌字注释",
    placeholder: "可输入（向嵌字说明的注释）",
  },
  { field: "translationNote", label: "翻校注释", placeholder: "可输入（仅翻校可见的注释）" },
] as const;

export function UnitAnnotationEditor({
  id,
  values,
  readOnly = false,
  onChange,
}: Props): JSX.Element | null {
  const visibleFields = fields.filter(({ field }) => !readOnly || Boolean(values[field]));
  if (visibleFields.length === 0) return null;
  return (
    <div id={id} data-workbench-shortcuts="ignore">
      <div className="mx-auto my-2 h-px w-4/5 bg-surface-gray-300" />
      <div className="flex flex-col gap-1">
        {visibleFields.map(({ field, label, placeholder }) => (
          <label key={field} className="flex items-start gap-2">
            <span
              id={`unit-note-${id}-${field}-label`}
              className="shrink-0 text-xs font-semibold italic leading-5 text-ink-gray-700"
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
