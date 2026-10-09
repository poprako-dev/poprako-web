const naturalOrder = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

export function orderArtworkPages<Value extends { filename: string; directory: boolean }>(
  entries: readonly Value[],
  pageCount: number,
): Value[] {
  const pages = entries.filter((entry) => !entry.directory && /\.psd$/iu.test(entry.filename));
  pages.sort(
    (a, b) =>
      naturalOrder.compare(a.filename, b.filename) ||
      (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0),
  );
  if (pages.length !== pageCount)
    throw new Error(
      `嵌稿包中有 ${String(pages.length)} 个 PSD，当前章节有 ${String(pageCount)} 页，无法对应预览`,
    );
  return pages;
}
