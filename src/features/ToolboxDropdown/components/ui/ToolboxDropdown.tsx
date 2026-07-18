import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import type { ToolboxOption } from "../../types/types";
import clsx from "clsx";

type Props = {
  options: ToolboxOption[];
  direction?: "up" | "down";
};

export default function ToolboxDropdown({ options, direction = "down" }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  return (
    <div>
      {/* 相对定位组件容器，包含按钮和下拉栏  */}
      <div
        style={{ opacity: 0.85 }}
        className={clsx("relative")}
        ref={dropdownRef}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300 border",
            isOpen
              ? "bg-green-50 text-gray-800 shadow-lg"
              : "bg-white border-gray-200 text-gray-700 shadow-sm",
          )}
          aria-label="工具菜单"
          aria-expanded={isOpen}
        >
          <Menu size={16} strokeWidth={3} />
        </button>

        {/* 纵向图标长条面板 */}
        {isOpen && (
          <div
            className={clsx(
              "absolute left-0 w-8 bg-white rounded-lg shadow-xl border",
              "border-gray-100 overflow-hidden z-50 animate-in fade-in duration-300",
              direction === "up"
                ? "bottom-full mb-3 slide-in-from-bottom-4"
                : "top-full mt-3 slide-in-from-top-4",
            )}
          >
            <div className="flex flex-col divide-y divide-gray-50">
              {options.map((item, index) => (
                <button
                  type="button"
                  key={index}
                  className={clsx(
                    "w-8 h-8 flex items-center justify-center",
                    "transition-all duration-200 hover:bg-gray-50 group",
                  )}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  title={item.title}
                >
                  <div className="transform group-hover:scale-110 group-active:scale-95 transition-transform">
                    {item.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
