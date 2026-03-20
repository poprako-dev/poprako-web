import clsx from "clsx";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export type Props = {
  /** 图标元素 */
  icon: React.ReactNode;
  /** 输入框的占位符文本 */
  placeholder?: string;
  /** 输入框的当前值 */
  value?: string;
  /** 输入框值变化时的回调函数 */
  onChange?: (newValue: string) => void;
  /** 当为 true 时，作为密码输入框渲染，右侧显示可切换可见性的眼睛 */
  password?: boolean;
  /** 当为 true 时，仅允许输入数字（非 password 模式） */
  numeric?: boolean;
  /** 外部注入的样式类 */
  className?: string;
};

export default function IconInputRow({
  icon,
  placeholder,
  value,
  onChange,
  password,
  className,
  numeric,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = password ? (showPassword ? "text" : "password") : "text";

  if (password && numeric) {
    // Warn developers at runtime if both modes are enabled; TypeScript won't enforce here.
    console.error(
      'IconInputRow: "password" and "numeric" cannot be true at the same time.',
    );
  }

  return (
    <div className={clsx("group relative w-full h-full", className)}>
      {/* 左侧图标 - 绝对定位 */}
      <div
        className={clsx(
          "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3",
          "text-slate-400 transition-colors duration-200",
          "group-focus-within:text-slate-600",
        )}
      >
        {icon}
      </div>

      {/* 输入框本体 */}
      <input
        className={clsx(
          "block w-full transition-all duration-200 ease-in-out",
          "h-8 rounded-md py-1 pl-9 text-sm",
          password ? "pr-9" : "pr-3",
          "bg-white text-slate-700 placeholder:text-slate-400",
          "border border-slate-200",
          "shadow-sm shadow-slate-100",
          // 悬停样式：平滑变深 + 极其微小的外发光感
          "hover:border-slate-300",
          // 移除 Focus 时的强烈对比，保持纯净
          "focus:border-slate-300 focus:ring-0 focus:outline-none",
        )}
        type={inputType}
        inputMode={numeric ? "numeric" : undefined}
        pattern={numeric ? "\\d*" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (numeric) {
            const sanitized = v.replace(/\D+/g, "");
            onChange?.(sanitized);
            return;
          }
          onChange?.(v);
        }}
      />

      {/* 右侧眼睛切换按钮 */}
      {password && (
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className={clsx(
            "absolute inset-y-0 right-0 flex items-center pr-2",
            "text-slate-400 hover:text-slate-600",
            "transition-colors duration-200 focus:outline-none",
          )}
          aria-label={showPassword ? "隐藏密码" : "显示密码"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}
