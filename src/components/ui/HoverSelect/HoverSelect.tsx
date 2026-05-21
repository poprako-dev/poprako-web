import type { Option } from "./types";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type Props = {
  /** 未选中时的提示文本 */
  hintText?: string;
  checkedOptionId: string;
  options: Option[];
  onSelect: (optionId: string) => void;
  /** 最大高度，以 tailwind 单位为单位 */
  maxHeight?: number;
  /** 是否处于 active 状态；active 时显示绿色边框 */
  isActive?: boolean;
  className?: string;
};

export default function HoverSelect({
  hintText = "请选择",
  checkedOptionId,
  options,
  onSelect,
  maxHeight = 8,
  isActive = false,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // 交互逻辑：hover 500ms 后展开
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  // 交互逻辑：离开 150ms 后关闭（避免鼠标经过按钮与下拉菜单间隙时意外收起）
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // 用于处理点击外部直接关闭的逻辑
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((opt) => opt.id === checkedOptionId) || null;

  // 立即关闭（用于点击外部、选中选项等场景）
  const closeDropdown = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setIsOpen(false);
  }, [clearOpenTimer, clearCloseTimer]);

  // 延迟关闭（用于 onMouseLeave，给鼠标越过间隙留出时间）
  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 150);
  }, [clearOpenTimer]);

  const scheduleOpen = () => {
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      setIsOpen(true);
      openTimerRef.current = null;
    }, 500);
  };

  // 交互逻辑：点击外部自动关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeDropdown]);

  // 组件卸载时，确保清理所有 timer
  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearOpenTimer, clearCloseTimer]);

  // 交互逻辑：选择处理
  const handleSelect = (option: Option) => {
    closeDropdown();
    onSelect(option.id);
  };

  return (
    <div
      ref={containerRef}
      className={clsx("relative font-sans text-sm", className)}
      onMouseEnter={() => {
        // 取消待执行的关闭计时器（鼠标重新进入容器时）
        clearCloseTimer();
        // 已经展开时不需要再次排队开启
        if (!isOpen) {
          scheduleOpen();
        }
      }}
      onMouseLeave={() => {
        scheduleClose();
      }}
    >
      {/* 触发器按钮 */}
      <button
        type="button"
        className={clsx(
          "flex h-full w-full items-center justify-between px-4 py-1",
          "rounded-sm font-medium outline-none",
          "transform-gpu border transition-all duration-300 ease-in-out",
          // 基础色调：淡白色与石板灰（边框颜色由 isActive 控制）
          "bg-white text-slate-700",
          // 悬停效果：极其微弱的加深和缩放
          "hover:border-slate-350/90 hover:shadow-sm",
          {
            "bg-white shadow-sm": isOpen,
          },
          // active 状态使用绿色 BG
          {
            "bg-emerald-200/80": isActive,
            "border-slate-200": !isActive,
          },
        )}
      >
        <span
          className={clsx("truncate", {
            "font-normal text-slate-400": !selectedOption,
          })}
        >
          {selectedOption ? selectedOption.text : hintText}
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-slate-400 transition-transform duration-300",
            { "rotate-180": isOpen },
          )}
        />
      </button>

      {/* 下拉菜单列表 */}
      <div
        className={clsx(
          "absolute z-50 mt-2 w-full overflow-hidden",
          "origin-top transform-gpu rounded-sm border transition-all duration-300 ease-in-out",
          // 下拉框色调：纯白底色，浅灰边框，较深阴影提升层次
          "border-slate-200/80 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]",
          {
            "translate-y-0 scale-100 opacity-100": isOpen,
            "pointer-events-none -translate-y-2 scale-95 opacity-0": !isOpen,
          },
        )}
      >
        <div
          className="scrollbar-thin scrollbar-thumb-slate-200 overflow-y-auto"
          style={{ maxHeight: `${maxHeight}rem` }}
        >
          {options.map((option) => {
            const isSelected = checkedOptionId === option.id;
            return (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className={clsx(
                  "flex transform-gpu cursor-pointer items-center justify-between px-4 py-2.5 transition-colors duration-300 ease-in-out",
                  "text-slate-600",
                  {
                    // 选中项：淡淡的灰色背景，不抢眼但有区分度
                    "bg-gray-200 font-semibold text-slate-900": isSelected,
                    "hover:bg-gray-100 hover:text-slate-800": !isSelected,
                  },
                )}
              >
                <span className="truncate">{option.text}</span>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-slate-400">
              无可用选项
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
