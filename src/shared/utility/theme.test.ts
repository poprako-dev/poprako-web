// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://localhost/"}
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  applyTheme,
  getThemePreference,
  resolveTheme,
  setThemePreference,
} from "@/shared/utility/theme";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => storage.delete(key),
      clear: () => {
        storage.clear();
      },
      key: (index: number) => [...storage.keys()][index] ?? null,
      get length() {
        return storage.size;
      },
    } satisfies Storage,
  });
});

afterEach(() => {
  storage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  vi.restoreAllMocks();
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: () => ({ matches: false }),
});

describe("theme preference", () => {
  test("defaults missing and invalid values to system", () => {
    expect(getThemePreference()).toBe("system");
    window.localStorage.setItem("poprako:theme", "sepia");
    expect(getThemePreference()).toBe("system");
  });

  test("resolves system and explicit preferences", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  test("applies a preference and notifies the current tab", () => {
    const listener = vi.fn();
    window.addEventListener("poprako:theme-preference-change", listener);
    setThemePreference("dark");
    window.removeEventListener("poprako:theme-preference-change", listener);

    expect(window.localStorage.getItem("poprako:theme")).toBe("dark");
    expect(listener).toHaveBeenCalledOnce();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  test("applies the system theme without changing its stored preference", () => {
    expect(applyTheme("system", true)).toBe("dark");
    expect(window.localStorage.getItem("poprako:theme")).toBeNull();
  });

  test("keeps a choice active when storage writes fail", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    setThemePreference("dark");

    expect(getThemePreference()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
  setThemePreference("system");
});
