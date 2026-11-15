import type { JSX } from "react/jsx-runtime";
import { CheckCheck, FileType } from "lucide-react";
import clsx from "clsx";
import type { UnitTextPart } from "@/route/_authenticated/translator/business/contract/unit-search-transform";

type Props = {
  part: UnitTextPart;
  disabled?: boolean;
  onChange: (part: UnitTextPart) => void;
};

const parts = [
  { id: "translatedText", label: "翻译文本", icon: FileType },
  { id: "proofreadText", label: "校对文本", icon: CheckCheck },
] as const;

export function PartSwitch({ part, disabled = false, onChange }: Props): JSX.Element {
  return (
    <div role="group" aria-label="搜索文本" className="flex rounded-sm bg-surface-stone-100 p-0.5">
      {parts.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={part === id}
          disabled={disabled}
          onClick={() => {
            onChange(id);
          }}
          className={clsx(
            "flex items-center rounded-xs px-2 py-1",
            "transition-all duration-200 motion-reduce:transition-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-40",
            part === id
              ? "bg-surface-white text-ink-gray-800 shadow-(--shadow-sm)"
              : "text-ink-slate-500 hover:text-ink-slate-700",
          )}
        >
          <Icon size={14} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
