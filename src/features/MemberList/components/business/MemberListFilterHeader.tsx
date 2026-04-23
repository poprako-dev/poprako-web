import { useEffect, useState } from "react";
import clsx from "clsx";
import { CirclePlus, Search } from "lucide-react";
import IconInputRow from "@/components/ui/IconInputRow";
import type { RoleFilter } from "../../types/types";

type Props = {
  activeFuzzyName: string;
  onChangeFuzzyName: (name: string) => void;
  activeRoles: RoleFilter[];
  onChangeRoles: (roles: RoleFilter[]) => void;
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
    activeClass: "bg-amber-50 text-amber-500 border-amber-200",
  },
  {
    key: "translator",
    label: "翻",
    activeClass: "bg-blue-50 text-blue-500 border-blue-200",
  },
  {
    key: "proofreader",
    label: "校",
    activeClass: "bg-emerald-50 text-emerald-500 border-emerald-200",
  },
  {
    key: "typesetter",
    label: "嵌",
    activeClass: "bg-violet-50 text-violet-400 border-violet-200",
  },
  {
    key: "redrawer",
    label: "美",
    activeClass: "bg-pink-50 text-pink-500 border-pink-200",
  },
  {
    key: "reviewer",
    label: "监",
    activeClass: "bg-indigo-50 text-indigo-400 border-indigo-200",
  },
  {
    key: "publisher",
    label: "传",
    activeClass: "bg-rose-50 text-rose-400 border-rose-200",
  },
];

export default function MemberListFilterHeader({
  activeFuzzyName,
  onChangeFuzzyName,
  activeRoles,
  onChangeRoles,
  onCreateMember,
}: Props) {
  const [inputValue, setInputValue] = useState(activeFuzzyName);

  useEffect(() => {
    setInputValue(activeFuzzyName);
  }, [activeFuzzyName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    onChangeFuzzyName(inputValue.trim());
  };

  const toggleRole = (key: RoleFilter) => {
    if (activeRoles.includes(key)) {
      onChangeRoles(activeRoles.filter((r) => r !== key));
    } else {
      onChangeRoles([...activeRoles, key]);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* 第一行：搜索框 + 创建按钮 */}
      <div className="flex h-10 w-full items-center gap-2">
        <div className="min-w-0 flex-1" onKeyDown={handleKeyDown}>
          <IconInputRow
            icon={<Search />}
            placeholder="昵称模糊搜索..."
            value={inputValue}
            onChange={(v) => setInputValue(v)}
          />
        </div>
        <button
          type="button"
          onClick={onCreateMember}
          title="添加成员"
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "border border-slate-200 bg-white text-slate-500 transition-all",
            "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
          )}
        >
          <CirclePlus size={24} />
        </button>
      </div>

      {/* 第二行：职位切换按钮 */}
      <div className="flex gap-1.5">
        {ROLE_BUTTONS.map(({ key, label, activeClass }) => {
          const isActive = activeRoles.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleRole(key)}
              className={clsx(
                "flex flex-1 items-center justify-center py-1.5",
                "rounded-sm border text-[12px] font-bold transition-all",
                isActive
                  ? activeClass
                  : clsx(
                      "bg-white text-slate-400 border-slate-200",
                      "hover:border-slate-300 hover:text-slate-500",
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
