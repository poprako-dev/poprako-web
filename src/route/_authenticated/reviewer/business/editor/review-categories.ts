import type { CategoryPresets } from "./category-presets";
import type { ReviewEditor } from "./review-editor-types";
import { ISSUE_TYPES } from "./issue-types";
import type { ReviewDocument } from "./review-editing";

const pendingPresets = new WeakMap<CategoryPresets, { from: string; to: string }>();

function requireReady(editor: ReviewEditor, type: string): void {
  if (editor.disabled || ISSUE_TYPES.includes(type)) throw new Error("此分类不能修改");
  if (!editor.props.project.pages.every((page) => editor.session.getSnapshot()[page.id]))
    throw new Error("分类引用尚未加载完成，请重试");
}

export async function removeCategory(
  editor: ReviewEditor,
  store: CategoryPresets,
  type: string,
): Promise<void> {
  requireReady(editor, type);
  editor.setCompleting(true);
  try {
    const summary = await editor.session.source.categories?.load();
    const local = Object.values(editor.session.getSnapshot()).some((page) =>
      page.issues.some((issue) => issue.variant === type),
    );
    if (local || summary?.variants.some((entry) => entry.variant === type && entry.count > 0))
      throw new Error("分类仍被标注引用，不能删除");
    store.write(store.read().filter((name) => name !== type));
  } finally {
    editor.setCompleting(false);
  }
}

export async function renameCategory(
  editor: ReviewEditor,
  store: CategoryPresets,
  type: string,
  name: string,
  types: string[],
): Promise<void> {
  requireReady(editor, type);
  const target = name.trim();
  const pending = pendingPresets.get(store);
  if (target === type) return;
  if (!target || (types.includes(target) && !(pending?.from === type && pending.to === target)))
    throw new Error("分类名称不能为空或与已有分类重复");
  editor.setCompleting(true);
  try {
    if (!(pending?.from === type && pending.to === target)) {
      await renameReferences(editor, type, target);
      pendingPresets.set(store, { from: type, to: target });
    }
    const presets = store.read();
    if (presets.includes(type))
      store.write(presets.map((value) => (value === type ? target : value)));
    pendingPresets.delete(store);
  } finally {
    editor.setCompleting(false);
  }
}

async function renameReferences(editor: ReviewEditor, from: string, to: string): Promise<void> {
  const { session } = editor;
  const source = session.source.categories;
  if (Object.values(session.getSnapshot()).some((page) => page.blocked))
    throw new Error("请先核对更新，再重命名分类");
  if (!source) {
    for (const [id, page] of Object.entries(session.getSnapshot()))
      session.commit(
        id,
        page.issues.map((issue) => (issue.variant === from ? { ...issue, variant: to } : issue)),
      );
    return;
  }
  const initial = await source.load();
  const locallyUsed = Object.values(session.getSnapshot()).some((page) =>
    page.issues.some((issue) => issue.variant === from),
  );
  if (!locallyUsed && !initial.variants.some((entry) => entry.variant === from)) return;
  for (const id of Object.keys(session.getSnapshot())) await session.save(id);
  for (const id of Object.keys(session.getSnapshot()))
    await session.load(id, new AbortController().signal);
  const summary = await source.load();
  if (
    Object.values(session.getSnapshot()).some(
      (page) => page.baseline.reviewKey !== summary.reviewKey,
    )
  )
    throw new Error("本章审查已更新，请重新加载后重试");
  if (!summary.variants.some((entry) => entry.variant === from)) {
    if (summary.variants.some((entry) => entry.variant === to))
      await applyRenamedDocuments(
        editor,
        Object.fromEntries(
          Object.entries(session.getSnapshot()).map(([id, page]) => [id, page.baseline]),
        ),
        from,
        to,
      );
    return;
  }
  const documents = await source.rename(summary, from, to);
  await applyRenamedDocuments(editor, documents, from, to);
}

async function applyRenamedDocuments(
  editor: ReviewEditor,
  documents: Record<string, ReviewDocument>,
  from: string,
  to: string,
): Promise<void> {
  const { session } = editor;
  for (const [id, document] of Object.entries(documents)) {
    const page = session.getSnapshot()[id];
    if (!page) continue;
    const rename = (issues: typeof page.issues): typeof page.issues =>
      issues.map((issue) => (issue.variant === from ? { ...issue, variant: to } : issue));
    session.publish(id, {
      ...page,
      baseline: document,
      issues: document.issues,
      history: page.history.map((entry) => ({
        before: rename(entry.before),
        after: rename(entry.after),
      })),
    });
    await session.retain(id);
  }
}
