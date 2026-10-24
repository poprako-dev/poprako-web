import { expect, test, vi } from "vitest";
import { createCategoryPresets } from "./category-presets";
import { ReviewSession } from "./review-session";
import { ReviewMemorySource } from "../test/review-memory-source";
import type { ReviewEditor } from "./review-editor-types";
import { removeCategory, renameCategory } from "./review-categories";

async function fixture(variant?: string): Promise<{
  editor: ReviewEditor;
  source: ReviewMemorySource;
  store: ReturnType<typeof createCategoryPresets>;
}> {
  const source = new ReviewMemorySource(() =>
    Promise.resolve(
      variant
        ? [{ id: "one", pageArtworkId: "page", index: 0, variant, note: "", rect: null }]
        : [],
    ),
  );
  const session = new ReviewSession(source);
  await session.load("page", new AbortController().signal);
  const editor = {
    session,
    disabled: false,
    setCompleting: vi.fn(),
    props: { project: { pages: [{ id: "page" }] } },
  } as unknown as ReviewEditor;
  return { editor, source, store: createCategoryPresets() };
}

test("a referenced category cannot be deleted even when present in personal presets", async () => {
  const { editor, store } = await fixture("留白");
  store.write(["留白"]);
  await expect(removeCategory(editor, store, "留白")).rejects.toThrow("仍被标注引用");
  expect(store.read()).toEqual(["留白"]);
});

test("renaming a chapter-only category does not turn it into a personal preset", async () => {
  const { editor, store } = await fixture("留白");
  await renameCategory(editor, store, "留白", "气泡留白", ["留白"]);
  expect(editor.session.page("page").issues[0]?.variant).toBe("气泡留白");
  expect(store.read()).toEqual([]);
});

test("unused local presets rename without writing chapter annotations", async () => {
  const { editor, source, store } = await fixture();
  store.write(["留白"]);
  const rename = vi.fn();
  editor.session.source.categories = {
    load: () => Promise.resolve({ reviewKey: "review-1", revision: "1", variants: [] }),
    rename,
  };
  await renameCategory(editor, store, "留白", "气泡留白", ["留白"]);
  expect(store.read()).toEqual(["气泡留白"]);
  expect(rename).not.toHaveBeenCalled();
  expect(source.saves).toEqual([]);
});

test("server references on other pages prevent deleting a locally unused preset", async () => {
  const { editor, store } = await fixture();
  store.write(["留白"]);
  editor.session.source.categories = {
    load: () =>
      Promise.resolve({
        reviewKey: "review-1",
        revision: "1",
        variants: [{ variant: "留白", count: 1 }],
      }),
    rename: vi.fn(),
  };
  await expect(removeCategory(editor, store, "留白")).rejects.toThrow("仍被标注引用");
  expect(store.read()).toEqual(["留白"]);
});

test("a failed local preset write retries without repeating the committed chapter rename", async () => {
  const { editor, store } = await fixture("留白");
  store.write(["留白"]);
  const page = editor.session.page("page").baseline;
  const rename = vi.fn().mockResolvedValue({
    page: {
      ...page,
      revision: "2",
      issues: page.issues.map((issue) => ({ ...issue, variant: "气泡留白" })),
    },
  });
  editor.session.source.categories = {
    load: () =>
      Promise.resolve({
        reviewKey: "review-1",
        revision: "1",
        variants: [{ variant: "留白", count: 1 }],
      }),
    rename,
  };
  vi.spyOn(store, "write").mockImplementationOnce(() => {
    throw new Error("storage failed");
  });
  await expect(renameCategory(editor, store, "留白", "气泡留白", ["留白"])).rejects.toThrow(
    "storage failed",
  );
  expect(editor.session.page("page").issues[0]?.variant).toBe("气泡留白");
  await renameCategory(editor, store, "留白", "气泡留白", ["留白", "气泡留白"]);
  expect(store.read()).toEqual(["气泡留白"]);
  expect(rename).toHaveBeenCalledOnce();
});
