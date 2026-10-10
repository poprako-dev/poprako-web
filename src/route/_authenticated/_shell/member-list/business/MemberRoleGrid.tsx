import { CheckCircle2, Circle } from "lucide-react";
import type { JSX } from "react";
import clsx from "clsx";

type RoleConfig = {
  label: string;
  value: number;
  activeClass: string;
};

const ROLE_CONFIG: RoleConfig[] = [
  {
    label: "图",
    value: 1,
    activeClass: "bg-surface-amber-50 text-text-amber border-line-amber-200",
  },
  { label: "翻", value: 2, activeClass: "bg-surface-sky-50 text-text-sky border-line-sky-200" },
  {
    label: "校",
    value: 4,
    activeClass: "bg-surface-emerald-50 text-text-emerald border-line-emerald-200",
  },
  {
    label: "嵌",
    value: 8,
    activeClass: "bg-surface-violet-50 text-text-violet border-line-violet-200",
  },
  { label: "美", value: 16, activeClass: "bg-surface-pink-50 text-text-pink border-line-pink-200" },
  {
    label: "监",
    value: 32,
    activeClass: "bg-surface-indigo-50 text-text-indigo border-line-indigo-200",
  },
  { label: "传", value: 64, activeClass: "bg-surface-rose-50 text-text-rose border-line-rose-200" },
  {
    label: "管",
    value: 128,
    activeClass: "bg-surface-stone-100 text-ink-stone-500 border-line-stone-200",
  },
];

export function MemberRoleGrid({
  selectedBits,
  onToggle,
}: {
  selectedBits: number;
  onToggle: (value: number) => void;
}): JSX.Element {
  return (
    <div className="flex-1 grid grid-cols-4 gap-1">
      {ROLE_CONFIG.map((role) => {
        const isActive = (selectedBits & role.value) !== 0;
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => {
              onToggle(role.value);
            }}
            className={clsx(
              "flex flex-row items-center justify-center gap-1.5",
              "rounded-sm border px-2 py-1 text-[11px] font-bold",
              "transition-all active:scale-95",
              isActive
                ? role.activeClass
                : clsx(
                    "border-line-slate-200 bg-surface-white text-text-muted-cool",
                    "hover:border-line-slate-300 hover:text-text-muted-cool",
                  ),
            )}
          >
            {isActive ? (
              <CheckCircle2 className="h-3 w-3 shrink-0" />
            ) : (
              <Circle className="h-3 w-3 shrink-0 opacity-30" />
            )}
            <span>{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}
