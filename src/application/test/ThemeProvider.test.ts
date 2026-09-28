// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://localhost/"}
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ThemeProvider } from "@/application/ThemeProvider";
import { useTheme } from "@/shared/hook/use-theme";
import { createElement, type ReactElement } from "react";

let onSystemChange: ((event: MediaQueryListEvent) => void) | undefined;
const storedValues = new Map<string, string>();

function ThemeControl(): ReactElement {
  const { preference, resolvedTheme } = useTheme();
  return createElement("output", null, `${preference}:${resolvedTheme}`);
}

function readTheme(): { preference: string; resolved: string } {
  const [preference, resolved] = (screen.getAllByRole("status").at(-1)?.textContent ?? "").split(
    ":",
  );
  return { preference: preference ?? "", resolved: resolved ?? "" };
}

beforeEach(() => {
  onSystemChange = undefined;
  storedValues.clear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storedValues.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storedValues.set(key, value);
      },
      removeItem: (key: string) => storedValues.delete(key),
      clear: () => {
        storedValues.clear();
      },
      key: (index: number) => [...storedValues.keys()][index] ?? null,
      get length() {
        return storedValues.size;
      },
    } satisfies Storage,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () =>
      ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          onSystemChange = listener;
        },
        removeEventListener: () => {
          onSystemChange = undefined;
        },
        dispatchEvent: () => true,
      }) as unknown as MediaQueryList,
  });
  window.localStorage.setItem("poprako:theme", "system");
});

afterEach(() => {
  cleanup();
  storedValues.clear();
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

describe("ThemeProvider", () => {
  test("syncs a preference selected in another tab", () => {
    window.localStorage.setItem("poprako:theme", "system");
    render(createElement(ThemeProvider, null, createElement(ThemeControl)));

    act(() => {
      window.localStorage.setItem("poprako:theme", "dark");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "poprako:theme",
          newValue: "dark",
        }),
      );
    });

    expect(readTheme()).toEqual({ preference: "dark", resolved: "dark" });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("follows system changes only while preference is system", () => {
    render(createElement(ThemeProvider, null, createElement(ThemeControl)));
    expect(readTheme()).toEqual({ preference: "system", resolved: "light" });

    act(() => {
      onSystemChange?.({ matches: true } as MediaQueryListEvent);
    });

    expect(readTheme()).toEqual({ preference: "system", resolved: "dark" });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("removes media, storage and preference listeners on unmount", () => {
    const { unmount } = render(createElement(ThemeProvider, null, createElement(ThemeControl)));
    expect(onSystemChange).toBeDefined();
    unmount();
    expect(onSystemChange).toBeUndefined();
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "poprako:theme",
          newValue: "dark",
        }),
      );
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
