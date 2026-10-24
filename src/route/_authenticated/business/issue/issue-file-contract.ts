import type { IssueInput, IssueRect, ImportChapterIssuesRequest } from "@/api/issue/issue-contract";
import { decodeArray, decodeNumber, decodeObject, decodeString } from "./issue-file-value";

function nonblank(value: unknown, label: string): string {
  const text = decodeString(value, label);
  if (!text.trim()) throw new Error(`${label} 不能为空白`);
  return text;
}

export function decodeIssueRect(value: unknown): IssueRect {
  const object = decodeObject(value, "标注区域");
  const rect = {
    xCoord: decodeNumber(object["xCoord"], "标注区域横坐标"),
    yCoord: decodeNumber(object["yCoord"], "标注区域纵坐标"),
    width: decodeNumber(object["width"], "标注区域宽度"),
    height: decodeNumber(object["height"], "标注区域高度"),
  };
  if (
    rect.xCoord < 0 ||
    rect.yCoord < 0 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    rect.xCoord + rect.width > 1 ||
    rect.yCoord + rect.height > 1
  )
    throw new Error("标注矩形必须为整页 0–1 坐标，宽高为正且不能越界");
  return rect;
}

export function decodeIssueInput(value: unknown): IssueInput {
  const object = decodeObject(value, "标注");
  const fields = ["variant", "rect", "note", "id", "pageArtworkId", "index"];
  if (Object.keys(object).some((key) => !fields.includes(key))) {
    throw new Error("标注包含不支持的字段");
  }
  return {
    variant: nonblank(object["variant"], "标注类型"),
    rect:
      object["rect"] === null || object["rect"] === undefined
        ? null
        : decodeIssueRect(object["rect"]),
    note: decodeString(object["note"], "标注说明"),
  };
}

export function decodeIssueImport(value: unknown): ImportChapterIssuesRequest {
  const object = decodeObject(value, "导入标注");
  return {
    pages: decodeArray(
      object["pages"],
      (value) => {
        const page = decodeObject(value, "page");
        return {
          pageArtworkId: nonblank(page["pageArtworkId"], "pageArtworkId"),
          issues: decodeArray(page["issues"], decodeIssueInput, "标注列表"),
        };
      },
      "pages",
    ),
  };
}
