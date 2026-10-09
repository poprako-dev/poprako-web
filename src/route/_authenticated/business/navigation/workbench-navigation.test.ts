import { afterEach, expect, test, vi } from "vitest";
import {
  parseWorkbenchSearch,
  readComicDetailMode,
  saveComicDetailMode,
  workbenchReturnDestination,
} from "./workbench-navigation";
afterEach(() => {
  vi.unstubAllGlobals();
});
test("return destination restores both workbenches to the correct comic and chapter", () => {
  const search = parseWorkbenchSearch({
    returnTo: "/comic-playground",
    comicId: "comic",
    chapterId: "chapter",
    readOnly: "true",
  });
  expect(workbenchReturnDestination(search, "reviewer")).toEqual({
    to: "/comic-playground",
    search: { comicId: "comic", chapterId: "chapter", detailMode: "reviewer" },
  });
  expect(workbenchReturnDestination(search, "translator")?.search.detailMode).toBe("translator");
  expect(
    workbenchReturnDestination(
      parseWorkbenchSearch({
        returnTo: "https://external.example",
        comicId: "comic",
        chapterId: "chapter",
      }),
      "reviewer",
    ),
  ).toBeUndefined();
  expect(
    workbenchReturnDestination(
      parseWorkbenchSearch({ returnTo: "/workspace", comicId: " ", chapterId: "chapter" }),
      "reviewer",
    ),
  ).toBeUndefined();
});
test("preferences are isolated per user and invalid values fall back to translation", () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  });
  expect(readComicDetailMode("first")).toBe("translator");
  saveComicDetailMode("first", "reviewer");
  expect(readComicDetailMode("first")).toBe("reviewer");
  expect(readComicDetailMode("second")).toBe("translator");
  values.set("comic-detail:mode:first", "garbage");
  expect(readComicDetailMode("first")).toBe("translator");
});
test("blocked storage does not prevent mode switching", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  });
  expect(readComicDetailMode("blocked-user")).toBe("translator");
  expect(() => {
    saveComicDetailMode("blocked-user", "reviewer");
  }).not.toThrow();
  expect(readComicDetailMode("blocked-user")).toBe("reviewer");
  expect(readComicDetailMode("other-blocked-user")).toBe("translator");
});
