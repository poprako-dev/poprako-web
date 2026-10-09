import { expect, test } from "vitest";
import { canImportIssues, parseIssueImport } from "./issue-import";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import { roleMask } from "@/route/business/identity/role";

test("accepts the PRK protocol with independent optional targets and verbatim notes", () => {
  const input = parseIssueImport(
    JSON.stringify({
      pages: [
        {
          issues: [
            { variant: "自定义", layer_path: "opaque:path", note: "" },
            {
              variant: "位置",
              rect: { x_coord: 0, y_coord: 0, width: 1, height: 1 },
              note: " \n说明\n ",
            },
          ],
        },
        { issues: [] },
      ],
    }),
    2,
  );
  expect(input.pages[0]?.issues).toEqual([
    { variant: "自定义", layerPath: "opaque:path", rect: null, note: "" },
    {
      variant: "位置",
      layerPath: null,
      rect: { xCoord: 0, yCoord: 0, width: 1, height: 1 },
      note: " \n说明\n ",
    },
  ]);
  expect(parseIssueImport('{"pages":[{"issues":[]},{"issues":[]}]}', 2)).toEqual({
    pages: [{ issues: [] }, { issues: [] }],
  });
});

test("rejects native MangaProof metadata, incomplete manifests and invalid issue geometry", () => {
  expect(() => parseIssueImport('{"schema_version":1,"issues":[]}', 1)).toThrow();
  expect(() => parseIssueImport('{"pages":[]}', 1)).toThrow("当前章节有 1 页");
  const invalid = [
    { variant: " ", note: "" },
    { variant: "位置", layer_path: " ", note: "" },
    { variant: "位置", note: "", rect: { x_coord: 0, y_coord: 0, width: 0, height: 0 } },
    { variant: "位置", note: "", rect: { x_coord: 0.9, y_coord: 0, width: 0.2, height: 0.1 } },
    { variant: "位置", note: "", rect: { x_coord: -0.1, y_coord: 0, width: 0.2, height: 0.1 } },
    {
      variant: "位置",
      note: "",
      rect: { x_coord: 0, y_coord: 0, width: Number.POSITIVE_INFINITY, height: 0.1 },
    },
  ];
  for (const issue of invalid)
    expect(() => parseIssueImport(JSON.stringify({ pages: [{ issues: [issue] }] }), 1)).toThrow();
});

test("only a current reviewer assignment can import an unpublished chapter", () => {
  const chapter = { id: "chapter", stages: 0 } as ChapterInfo;
  const reviewer = { chapterId: "chapter", roles: roleMask(["reviewer"]) } as AssignmentInfo;
  const admin = { chapterId: "chapter", roles: roleMask(["admin"]) } as AssignmentInfo;
  expect(canImportIssues(chapter, reviewer)).toBe(true);
  expect(canImportIssues(chapter, admin)).toBe(false);
  expect(canImportIssues(chapter, undefined)).toBe(false);
  expect(canImportIssues(chapter, { ...reviewer, chapterId: "other" })).toBe(false);
  expect(canImportIssues({ ...chapter, stages: 2 << 10 }, reviewer)).toBe(false);
});
