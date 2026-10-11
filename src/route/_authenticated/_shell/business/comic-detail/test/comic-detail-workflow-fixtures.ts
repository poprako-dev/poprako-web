import { roleMask } from "@/route/business/identity/role";
import type { Role } from "@/route/business/identity/role";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ChapterWorkflowRecord } from "@/route/_authenticated/business/chapter/chapter-workflow-record";
import { makeUser, now, required } from "./comic-detail-story-fixtures.ts";

// 超大量、超长名测试数据

const LONG_NAMES = [
  "芥見下下のファン一号",
  "夏油傑崇拜者999",
  "Александр Иванович Петров",
  "Wolfgang Amadeus Translator",
  "五条悟専属スタッフ二号三号四号",
  "MidnightBlossom_TL",
  "翻译组全能选手神里绫华的粉丝",
  "Bartholomew Thaddeus McAllister IV",
  "きみがいなければ翻译できない君",
  "超级无敌大好人不知道怎么命名",
];

export function makeManyAssignments(chapterId: string): AssignmentInfo[] {
  const groups: [Role, string[]][] = [
    [
      "rawProvider",
      ["佐仓绫音大粉丝", "RawHunterZero", "Nakamura Yū Fan", required(LONG_NAMES[0])],
    ],
    [
      "translator",
      [
        "Aki Translator",
        required(LONG_NAMES[2]),
        required(LONG_NAMES[6]),
        "Mitsuki",
        required(LONG_NAMES[9]),
        "神崎蘭子之友",
      ],
    ],
    [
      "proofreader",
      [required(LONG_NAMES[1]), required(LONG_NAMES[7]), "校对博士学位", "Proofreader_X", "星野"],
    ],
    [
      "typesetter",
      [
        required(LONG_NAMES[3]),
        required(LONG_NAMES[4]),
        "LayoutMaster2077",
        "排版狂魔不知疲倦的人",
        required(LONG_NAMES[8]),
      ],
    ],
    ["reviewer", [required(LONG_NAMES[5]), "ReviewerElite", "最终boss级监修官"]],
    ["publisher", ["Publisher_A", required(LONG_NAMES[9]), "全能发布王者"]],
  ];
  return groups.flatMap(([role, names], index) =>
    makeAssignmentGroup(
      chapterId,
      role,
      names,
      groups.slice(0, index).reduce((sum, group) => sum + group[1].length, 0),
    ),
  );
}

function makeAssignmentGroup(
  chapterId: string,
  role: Role,
  names: string[],
  previousCount: number,
): AssignmentInfo[] {
  return names.map((name, index) => {
    const id = previousCount + index + 1;
    const userId = `u-many-${String(id)}`;
    return {
      id: `am-${String(id)}`,
      chapterId,
      userId,
      user: makeUser(userId, name),
      roles: roleMask([role]),
      createdAt: now,
      updatedAt: now,
    };
  });
}

// Simulate async page delay
export function delay(ms: number): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function makeWorkflowRecords(chapterId: string): ChapterWorkflowRecord[] {
  return [
    ...latestWorkflowRecords(chapterId),
    ...importWorkflowRecords(chapterId),
    ...chapterWorkflowRecords(chapterId),
  ];
}

function latestWorkflowRecords(chapterId: string): ChapterWorkflowRecord[] {
  return [
    workflowRecord(
      chapterId,
      "12",
      "u-aki",
      {
        kind: "stage_transitioned",
        data: {
          stage: "typeset_redraw",
          previousPhase: "active",
          nextPhase: "completed",
          origin: "artwork_upload",
        },
      },
      1,
    ),
    workflowRecord(
      chapterId,
      "11",
      "u-aki",
      { kind: "artwork_exported", data: { artworkVersion: 7 } },
      2,
    ),
    workflowRecord(
      chapterId,
      "10",
      "u-aki",
      {
        kind: "stage_transitioned",
        data: {
          stage: "translate",
          previousPhase: "active",
          nextPhase: "completed",
          origin: "translation_import",
        },
      },
      4,
    ),
    workflowRecord(
      chapterId,
      "9",
      "u-aki",
      { kind: "translation_exported", data: { formats: { labelPlus: true, poprako: true } } },
      18,
    ),
  ];
}

function importWorkflowRecords(chapterId: string): ChapterWorkflowRecord[] {
  return [
    workflowRecord(
      chapterId,
      "8",
      "u-aki",
      {
        kind: "translation_imported",
        data: {
          format: "poprako",
          importedPageCount: 25,
          importedUnitCount: 186,
        },
      },
      32,
    ),
    workflowRecord(
      chapterId,
      "7",
      "u-admin",
      { kind: "assignment_deleted", data: { subjectUserId: "u-former", previousRoles: 4 } },
      51,
    ),
    workflowRecord(
      chapterId,
      "6",
      "u-admin",
      {
        kind: "assignment_roles_updated",
        data: {
          subjectUserId: "u-aki",
          previousRoles: 2,
          nextRoles: 6,
        },
      },
      76,
    ),
    workflowRecord(
      chapterId,
      "5",
      "u-admin",
      { kind: "assignment_created", data: { subjectUserId: "u-aki", roles: 2 } },
      105,
    ),
  ];
}

function chapterWorkflowRecords(chapterId: string): ChapterWorkflowRecord[] {
  return [
    workflowRecord(chapterId, "4", "u-admin", { kind: "chapter_unpinned" }, 144),
    workflowRecord(chapterId, "3", "u-admin", { kind: "chapter_pinned" }, 175),
    workflowRecord(
      chapterId,
      "2",
      "u-admin",
      {
        kind: "chapter_subtitle_updated",
        data: { previousSubtitle: "", nextSubtitle: "深渊回响" },
      },
      220,
    ),
    workflowRecord(chapterId, "1", null, { kind: "chapter_created" }, 260),
  ];
}

function workflowRecord(
  chapterId: string,
  recordId: string,
  actorUserId: string | null,
  event: ChapterWorkflowRecord["event"],
  ageMinutes: number,
): ChapterWorkflowRecord {
  return {
    id: `${chapterId}-record-${recordId}`,
    chapterId,
    actorUserId,
    event,
    createdAt: now - 1000 * 60 * ageMinutes,
  };
}
