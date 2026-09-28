import type { JSX } from "react";
import { useTheme } from "@/shared/hook/use-theme";

export function ThemePreferenceSelect(): JSX.Element {
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className="flex flex-col gap-2 px-6 py-4">
      <legend className="text-lg font-medium">界面主题</legend>
      <div className="flex flex-wrap gap-3">
        {(
          [
            ["light", "浅色"],
            ["dark", "深色"],
            ["system", "跟随系统"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => {
                setPreference(value);
              }}
              className="accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
