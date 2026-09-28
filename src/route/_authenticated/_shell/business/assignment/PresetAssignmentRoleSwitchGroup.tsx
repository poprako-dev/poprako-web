import clsx from "clsx";
import type { MemberInfo } from "@/route/business/identity/member";
import { hasRole, type Role } from "@/route/business/identity/role";

const ROLE_OPTIONS: { role: Role; label: string }[] = [
  { role: "rawProvider", label: "图源" },
  { role: "translator", label: "翻译" },
  { role: "proofreader", label: "校对" },
  { role: "typesetter", label: "嵌字" },
  { role: "redrawer", label: "美工" },
  { role: "reviewer", label: "监修" },
  { role: "publisher", label: "发布" },
  { role: "admin", label: "管理" },
];

type Props = {
  activeMember: MemberInfo | null;
  value: Role[];
  onChange: (roles: Role[]) => void;
};

export function PresetAssignmentRoleSwitchGroup({
  activeMember,
  value,
  onChange,
}: Props): JSX.Element {
  function handleToggle(role: Role): void {
    if (role === "admin" || !activeMember || !hasRole(activeMember, role)) {
      return;
    }

    onChange(
      value.includes(role)
        ? value.filter((selectedRole) => selectedRole !== role)
        : [...value, role],
    );
  }

  return (
    <div className="mt-3" role="group" aria-label="创建者分工">
      <div className="grid grid-cols-4 gap-1.5">
        {ROLE_OPTIONS.map(({ role, label }) => {
          const isMandatory = role === "admin";
          const isAvailable = activeMember !== null && hasRole(activeMember, role);
          const isSelected = isMandatory || value.includes(role);
          const isDisabled = isMandatory || !isAvailable;

          return (
            <button
              key={role}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              title={
                isMandatory
                  ? "创建者固定拥有管理权限"
                  : isAvailable
                    ? undefined
                    : "当前成员不具备该职位"
              }
              onClick={() => {
                handleToggle(role);
              }}
              className={clsx(
                "min-w-0 rounded-sm border px-2 py-1",
                "text-xs font-medium transition-colors duration-150",
                "shadow-sm",
                isSelected
                  ? ["border-(--primary-border) bg-(--primary-subtle)", "text-ink-slate-500"]
                  : "border-line-slate-200 bg-surface-white text-ink-slate-400 hover:border-line-slate-300",
                !isAvailable &&
                  !isMandatory &&
                  "cursor-not-allowed border-line-slate-100 bg-surface-slate-50 text-ink-slate-300",
                isMandatory && "cursor-default",
              )}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
import type { JSX } from "react";
