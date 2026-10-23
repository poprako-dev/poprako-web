import type { AppendTermbaseBody } from "@/api/terminology/append";

export const MAX_APPEND_FILE_BYTES = 8 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// JSON.parse discards duplicate keys. Check them before sending the parsed document.
function rejectDuplicateKeys(content: string): void {
  const objects: Set<string>[] = [];
  for (const match of content.matchAll(/"(?:\\.|[^"\\])*"(\s*:)?|[{}]/gu)) {
    const token = match[0];
    if (token === "{") objects.push(new Set());
    else if (token === "}") objects.pop();
    else if (match[1]) {
      const key = JSON.parse(token.slice(0, -match[1].length)) as string;
      const keys = objects.at(-1);
      if (keys?.has(key)) throw new Error("术语文件包含重复字段");
      keys?.add(key);
    }
  }
}

function isTerm(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.keys(value).every((key) => ["source", "targets", "comment"].includes(key)) &&
    typeof value["source"] === "string" &&
    Array.isArray(value["targets"]) &&
    value["targets"].every((target: unknown) => typeof target === "string") &&
    (value["comment"] === null ||
      value["comment"] === undefined ||
      typeof value["comment"] === "string")
  );
}

export function parseTermbaseAppend(content: string): AppendTermbaseBody {
  if (new TextEncoder().encode(content).byteLength > MAX_APPEND_FILE_BYTES)
    throw new Error("术语文件不能超过 8 MiB");
  const document: unknown = JSON.parse(content);
  rejectDuplicateKeys(content);
  if (
    !isRecord(document) ||
    Object.keys(document).some((key) => key !== "terms") ||
    !Array.isArray(document["terms"]) ||
    !document["terms"].every(isTerm)
  ) {
    throw new Error("请选择仅包含 terms 的术语追加文件");
  }
  return document as AppendTermbaseBody;
}
