type PageIdentity = {
  id: string;
};

export function findNextEditedPageIndex(
  pages: PageIdentity[],
  currentPageIndex: number,
  editedPageIds: string[],
): number {
  const editedPageIdSet = new Set(editedPageIds);

  return pages.findIndex((page, index) => index > currentPageIndex && editedPageIdSet.has(page.id));
}
