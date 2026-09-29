function hasControlCharacter(name: string): boolean {
  for (const character of name) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint === 127 || codePoint <= 31) {
      return true;
    }
  }
  return false;
}

function isUsableArchiveFileName(name: string): boolean {
  return (
    name.trim().length > 0 &&
    name !== "." &&
    name !== ".." &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !hasControlCharacter(name)
  );
}

function numberedDuplicate(name: string, duplicateIndex: number): string {
  const extensionIndex = name.lastIndexOf(".");
  const hasExtension = extensionIndex > 0;
  const stem = hasExtension ? name.slice(0, extensionIndex) : name;
  const extension = hasExtension ? name.slice(extensionIndex) : "";
  return `${stem} (${String(duplicateIndex)})${extension}`;
}

type PageImageNameInput = {
  pageId: string;
  defaultName: string;
};

export function resolveArchiveImageNames(
  pages: PageImageNameInput[],
  rawIdentByPageId: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> {
  const usedNames = new Set(pages.map((page) => page.defaultName.toLocaleLowerCase()));
  const resolvedNames = new Map<string, string>();

  for (const page of pages) {
    const name = rawIdentByPageId.get(page.pageId);
    if (!name || name === page.defaultName) {
      continue;
    }
    if (!isUsableArchiveFileName(name)) {
      continue;
    }

    let resolvedName = name;
    let duplicateIndex = 2;
    while (usedNames.has(resolvedName.toLocaleLowerCase())) {
      resolvedName = numberedDuplicate(name, duplicateIndex);
      duplicateIndex += 1;
    }
    usedNames.add(resolvedName.toLocaleLowerCase());
    resolvedNames.set(page.pageId, resolvedName);
  }

  return resolvedNames;
}
