import { type JSX, useEffect, useState } from "react";
import clsx from "clsx";
import { CirclePlus, Search } from "lucide-react";
import { IconInputRow } from "@/shared/component/IconInputRow";
import type { RoleFilter } from "@/route/_authenticated/_shell/member-list/business/member-list-type";
import { isKeyboardComposing } from "@/shared/utility/keyboard";

type Props = {
  activeFuzzyName: string;
  onChangeFuzzyName: (name: string) => void;
  activeRole: RoleFilter | null;
  onChangeRole: (role: RoleFilter | null) => void;
  onCreateMember: () => void;
};

type RoleButton = {
  key: RoleFilter;
  label: string;
  activeClass: string;
};

const ROLE_BUTTONS: RoleButton[] = [
  {
    key: "rawProvider",
    label: "图",
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    key: "translator",
    label: "翻",
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    key: "proofreader",
    label: "校",
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    key: "typesetter",
    label: "嵌",
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    key: "redrawer",
    label: "美",
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    key: "reviewer",
    label: "监",
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    key: "publisher",
    label: "传",
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
];

export function MemberListFilterHeader({
  activeFuzzyName,
  onChangeFuzzyName,
  activeRole,
  onChangeRole,
  onCreateMember,
}: Props): JSX.Element {
  const [inputValue, setInputValue] = useState(activeFuzzyName);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect
    setInputValue(activeFuzzyName);
  }, [activeFuzzyName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key !== "Enter" || isKeyboardComposing(e.nativeEvent)) return;
    onChangeFuzzyName(inputValue.trim());
  };

  const toggleRole = (key: RoleFilter): void => {
    onChangeRole(activeRole === key ? null : key);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* 第一行：搜索框 + 创建按钮 */}
      <div className="flex h-10 w-full items-center gap-2">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div className="min-w-0 flex-1" role="group" tabIndex={-1} onKeyDown={handleKeyDown}>
          <IconInputRow
            icon={<Search />}
            placeholder="昵称模糊搜索..."
            value={inputValue}
            onChange={(v) => {
              setInputValue(v);
            }}
          />
        </div>
        <button
          type="button"
          onClick={onCreateMember}
          title="添加成员"
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "border border-border bg-surface-panel text-muted-foreground transition-all",
            "hover:border-border hover:bg-muted hover:text-foreground",
          )}
        >
          <CirclePlus size={24} />
        </button>
      </div>

      {/* 第二行：职位切换按钮 */}
      <div className="flex gap-1.5">
        {ROLE_BUTTONS.map(({ key, label, activeClass }) => {
          const isActive = activeRole === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                toggleRole(key);
              }}
              className={clsx(
                "flex flex-1 items-center justify-center py-1.5",
                "rounded-sm border text-[12px] font-bold transition-all",
                isActive
                  ? activeClass
                  : clsx(
                      "bg-surface-panel text-muted-foreground border-border",
                      "hover:border-border hover:text-muted-foreground",
                    ),
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
