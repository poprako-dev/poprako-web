import type { ReactElement } from "react";
import { CirclePlus, Search } from "lucide-react";
import clsx from "clsx";
import { IconInputRow } from "@/shared/component/IconInputRow";

type Props = {
  query: string;
  placeholder: string;
  createLabel: string;
  canCreate: boolean;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
};

export function TeamTerminologyToolbar({
  query,
  placeholder,
  createLabel,
  canCreate,
  onQueryChange,
  onCreate,
}: Props): ReactElement {
  return (
    <div className="mb-2 flex h-10 w-full shrink-0 items-center gap-2">
      <div className="min-w-0 flex-1">
        <IconInputRow
          icon={<Search />}
          placeholder={placeholder}
          value={query}
          onChange={onQueryChange}
        />
      </div>
      {canCreate && (
        <button
          type="button"
          aria-label={createLabel}
          title={createLabel}
          onClick={onCreate}
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
            "border border-line-slate-200 bg-surface-white text-text-muted-cool",
            "hover:border-line-slate-300 hover:shadow-sm hover:bg-surface-gray-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <CirclePlus className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
