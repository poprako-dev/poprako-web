import { useLayoutEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { ThemeContext } from "@/shared/hook/use-theme";
import type { ThemeContextValue } from "@/shared/hook/use-theme";
import {
  applyTheme,
  getThemePreference,
  parseThemePreference,
  resolveTheme,
  setThemePreference,
  themePreferenceEventName,
  type ThemePreference,
} from "@/shared/utility/theme";

type Props = { children: ReactNode };

export function ThemeProvider({ children }: Props): ReactElement {
  const [preference, setPreference] = useState(getThemePreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const resolvedTheme = resolveTheme(preference, systemPrefersDark);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange(event: MediaQueryListEvent): void {
      setSystemPrefersDark(event.matches);
    }
    function onPreferenceChange(event: Event): void {
      const value = (event as CustomEvent<ThemePreference>).detail;
      setPreference(value);
    }
    function onStorage(event: StorageEvent): void {
      if (event.key === "poprako:theme" || event.key === null) {
        setPreference(event.key === null ? "system" : parseThemePreference(event.newValue));
      }
    }

    media.addEventListener("change", onSystemChange);
    window.addEventListener(themePreferenceEventName, onPreferenceChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener(themePreferenceEventName, onPreferenceChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useLayoutEffect(() => {
    applyTheme(preference, systemPrefersDark);
  }, [preference, systemPrefersDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference: (next) => {
        setThemePreference(next);
        setPreference(next);
      },
    }),
    [preference, resolvedTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
