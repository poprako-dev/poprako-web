import { decodeArray, decodeNumber, decodeObject, decodeString } from "@/api/contract";
import { ApiDecodeError } from "@/api/api-error";

export type IssueRect = { xCoord: number; yCoord: number; width: number; height: number };
export type IssueInput = {
  variant: string;
  layerPath: string | null;
  rect: IssueRect | null;
  note: string;
};
export type IssueResponse = IssueInput & { id: string; pageId: string; index: number };
export type ImportChapterIssuesRequest = { pages: { issues: IssueInput[] }[] };
export type ImportChapterIssuesResult = { importedPageCount: number; importedIssueCount: number };

function nonblank(value: unknown, label: string): string {
  const text = decodeString(value, label);
  if (!text.trim()) throw new ApiDecodeError(`${label} 不能为空白`);
  return text;
}

export function decodeIssueRect(value: unknown): IssueRect {
  const object = decodeObject(value, "issue.rect");
  const rect = {
    xCoord: decodeNumber(object["xCoord"], "rect.xCoord"),
    yCoord: decodeNumber(object["yCoord"], "rect.yCoord"),
    width: decodeNumber(object["width"], "rect.width"),
    height: decodeNumber(object["height"], "rect.height"),
  };
  if (
    rect.xCoord < 0 ||
    rect.yCoord < 0 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.xCoord + rect.width > 1 ||
    rect.yCoord + rect.height > 1
  )
    throw new ApiDecodeError("issue 矩形必须为整页 0–1 坐标，宽高为正且不能越界");
  return rect;
}

export function decodeIssueInput(value: unknown): IssueInput {
  const object = decodeObject(value, "issue");
  return {
    variant: nonblank(object["variant"], "issue.variant"),
    layerPath:
      object["layerPath"] === null || object["layerPath"] === undefined
        ? null
        : nonblank(object["layerPath"], "issue.layerPath"),
    rect:
      object["rect"] === null || object["rect"] === undefined
        ? null
        : decodeIssueRect(object["rect"]),
    note: decodeString(object["note"], "issue.note"),
  };
}

export function decodeIssue(value: unknown): IssueResponse {
  const object = decodeObject(value, "issue");
  const index = decodeNumber(object["index"], "issue.index");
  if (!Number.isSafeInteger(index) || index < 0) throw new Error("issue.index 必须为非负整数");
  // Responses require explicit nullable fields; missing fields are contract errors.
  if (object["layerPath"] === undefined || object["rect"] === undefined) {
    throw new Error("issue 缺少 layerPath 或 rect");
  }
  return {
    ...decodeIssueInput(value),
    id: decodeString(object["id"]),
    pageId: decodeString(object["pageId"]),
    index,
  };
}

export function decodeIssueImport(value: unknown): ImportChapterIssuesRequest {
  const object = decodeObject(value, "issue import");
  return {
    pages: decodeArray(
      object["pages"],
      (value) => {
        const page = decodeObject(value, "page");
        return { issues: decodeArray(page["issues"], decodeIssueInput, "issues") };
      },
      "pages",
    ),
  };
}
