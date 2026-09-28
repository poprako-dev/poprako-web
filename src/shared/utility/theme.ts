export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

const storageKey = "poprako:theme";
const preferenceEvent = "poprako:theme-preference-change";
let volatilePreference: ThemePreference | null = null;

export function parseThemePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function getThemePreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (value === null) {
      return volatilePreference ?? "system";
    }
    return parseThemePreference(value);
  } catch {
    return volatilePreference ?? "system";
  }
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(storageKey, preference);
    volatilePreference = null;
  } catch {
    // The preference still applies for this session when storage is unavailable.
    volatilePreference = preference;
  }
  window.dispatchEvent(new CustomEvent(preferenceEvent, { detail: preference }));
  applyTheme(preference, window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  return preference === "system" ? (systemPrefersDark ? "dark" : "light") : preference;
}

export function applyTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  const theme = resolveTheme(preference, systemPrefersDark);
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  return theme;
}

export function initializeTheme(): ResolvedTheme {
  return applyTheme(
    getThemePreference(),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export const themePreferenceEventName = preferenceEvent;
