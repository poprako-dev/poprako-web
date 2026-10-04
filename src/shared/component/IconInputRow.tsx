import clsx from "clsx";
import { useState, type ReactElement } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  icon: ReactElement;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mode?: "text" | "password" | "numeric";
  className?: string;
};

export function IconInputRow({
  icon,
  placeholder,
  value,
  onChange,
  mode = "text",
  className,
}: Props): ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = mode === "password";
  const isNumeric = mode === "numeric";

  return (
    <div className={clsx("group relative w-full h-full", className)}>
      <div
        className={clsx(
          "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3",
          "text-icon-muted-cool transition-colors duration-200",
          "group-focus-within:text-ink-slate-600",
        )}
        aria-hidden
      >
        {icon}
      </div>
      <input
        className={clsx(
          "block w-full transition-all duration-200 ease-in-out",
          "h-8 rounded-md py-1 pl-9 text-sm",
          isPassword ? "pr-9" : "pr-3",
          "bg-surface-white text-ink-slate-700 placeholder:text-text-muted-cool",
          "border border-control-border",
          "shadow-sm shadow-shadow-slate-100",
          // 悬停样式：平滑变深 + 极其微小的外发光感
          "hover:border-control-border",
          "focus:border-focus-indicator focus:ring-0 focus:outline-none",
        )}
        type={isPassword && !showPassword ? "password" : "text"}
        inputMode={isNumeric ? "numeric" : undefined}
        pattern={isNumeric ? String.raw`\d*` : undefined}
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(isNumeric ? nextValue.replaceAll(/\D+/g, "") : nextValue);
        }}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => {
            setShowPassword((current) => !current);
          }}
          className={clsx(
            "absolute inset-y-0 right-0 flex items-center pr-2",
            "text-icon-muted-cool hover:text-ink-slate-600",
            "transition-colors duration-200 focus:outline-none",
          )}
          aria-label={showPassword ? "隐藏密码" : "显示密码"}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}
