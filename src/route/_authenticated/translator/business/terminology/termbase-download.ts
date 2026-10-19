function exportName(content: string): string {
  const document: unknown = JSON.parse(content);
  if (
    typeof document !== "object" ||
    document === null ||
    !("name" in document) ||
    typeof document.name !== "string"
  ) {
    throw new Error("导出文件缺少术语库名称");
  }
  return document.name;
}

export function downloadTermbase(content: string): void {
  const name = exportName(content);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.json`;
  try {
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }
}
