import clsx from "clsx";
import { useState, type ReactElement, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  mode?: "text" | "password" | "numeric";
  placeholder?: string;
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
    <div className={clsx("group relative h-full w-full", className)}>
      <div
        className={clsx(
          "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3",
          "text-muted-foreground transition-colors group-focus-within:text-foreground",
        )}
        aria-hidden
      >
        {icon}
      </div>
      <input
        className={clsx(
          "block h-8 w-full rounded-md border border-input bg-background py-1 pl-9",
          "text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground",
          "hover:border-ring focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring",
          isPassword ? "pr-9" : "pr-3",
        )}
        type={isPassword && !showPassword ? "password" : "text"}
        inputMode={isNumeric ? "numeric" : undefined}
        pattern={isNumeric ? String.raw`\d*` : undefined}
        placeholder={placeholder}
        aria-label={placeholder ?? "输入内容"}
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
            "absolute inset-y-0 right-0 flex items-center pr-2 text-muted-foreground",
            "transition-colors hover:text-foreground focus-visible:outline-ring",
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
