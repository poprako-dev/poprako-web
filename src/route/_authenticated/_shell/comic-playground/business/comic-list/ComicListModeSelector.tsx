import type { ReactElement } from "react";
import { Archive, Eye, PencilLine } from "lucide-react";
import clsx from "clsx";
import type { ComicListMode } from "./comic-list-mode";

type Props = { mode: ComicListMode; onChange: (mode: ComicListMode) => void };

const modes = [
  { id: "translator", label: "翻译模式", icon: PencilLine },
  { id: "reviewer", label: "监修模式", icon: Eye },
  { id: "archive", label: "归档浏览", icon: Archive },
] as const;

export function ComicListModeSelector({ mode, onChange }: Props): ReactElement {
  return (
    <div className="flex items-center justify-between shrink-0 pb-3">
      <div className="flex-1 mr-4" aria-hidden="true">
        <div
          className="w-full h-0.5 rounded-sm"
          style={{
            background: "linear-gradient(90deg, rgba(148,163,184,1) 0%, rgba(148,163,184,0) 60%)",
          }}
        />
      </div>
      <div
        role="group"
        aria-label="浏览模式"
        className="flex rounded-lg bg-surface-stone-100/80 p-0.5"
      >
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={mode === id}
            onClick={() => {
              onChange(id);
            }}
            className={clsx(
              "rounded-md px-3 py-1.5 flex items-center gap-2",
              "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
              mode === id
                ? "bg-surface-gray-200 text-ink-gray-800 shadow-(--shadow-sm)"
                : "text-text-muted-cool hover:text-ink-slate-600",
            )}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
