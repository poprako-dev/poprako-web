import type { AssignmentInfo } from "@/routes/_authenticated/business/assignment/assignment";
import type { ChapterWorkflowRecord } from "@/routes/_authenticated/business/chapter/chapter-workflow-record";
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
  const assignments: AssignmentInfo[] = [];
  let idCounter = 1;

  const push = (
    name: string,
    role: keyof Omit<
      AssignmentInfo,
      "id" | "chapterId" | "userId" | "user" | "createdAt" | "updatedAt"
    >,
  ): void => {
    const uid = `u-many-${String(idCounter)}`;
    assignments.push({
      id: `am-${String(idCounter)}`,
      chapterId,
      userId: uid,
      user: makeUser(uid, name),
      [role]: now,
      createdAt: now,
      updatedAt: now,
    });
    idCounter++;
  };

  // 4x 原始提供者
  for (const n of ["佐仓绫音大粉丝", "RawHunterZero", "Nakamura Yū Fan", required(LONG_NAMES[0])]) {
    push(n, "assignedRawProviderAt");
  }

  // 6x 翻译
  for (const n of [
    "Aki Translator",
    required(LONG_NAMES[2]),
    required(LONG_NAMES[6]),
    "Mitsuki",
    required(LONG_NAMES[9]),
    "神崎蘭子之友",
  ]) {
    push(n, "assignedTranslatorAt");
  }

  // 5x 校对
  for (const n of [
    required(LONG_NAMES[1]),
    required(LONG_NAMES[7]),
    "校对博士学位",
    "Proofreader_X",
    "星野",
  ]) {
    push(n, "assignedProofreaderAt");
  }

  // 5x 排版
  for (const n of [
    required(LONG_NAMES[3]),
    required(LONG_NAMES[4]),
    "LayoutMaster2077",
    "排版狂魔不知疲倦的人",
    required(LONG_NAMES[8]),
  ]) {
    push(n, "assignedTypesetterAt");
  }

  // 3x 监修
  for (const n of [required(LONG_NAMES[5]), "ReviewerElite", "最终boss级监修官"]) {
    push(n, "assignedReviewerAt");
  }

  // 3x 发布
  for (const n of ["Publisher_A", required(LONG_NAMES[9]), "全能发布王者"]) {
    push(n, "assignedPublisherAt");
  }

  return assignments;
}

// Simulate async page delay
export function delay(ms: number): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function makeWorkflowRecords(chapterId: string): ChapterWorkflowRecord[] {
  return [
    {
      id: `${chapterId}-record-12`,
      chapterId,
      actorUserId: "u-aki",
      event: {
        kind: "stage_transitioned",
        data: {
          stage: "typeset_redraw",
          previousPhase: "active",
          nextPhase: "completed",
          origin: "artwork_upload",
        },
      },
      createdAt: now - 1000 * 60,
    },
    {
      id: `${chapterId}-record-11`,
      chapterId,
      actorUserId: "u-aki",
      event: {
        kind: "artwork_exported",
        data: { artworkVersion: 7 },
      },
      createdAt: now - 1000 * 60 * 2,
    },
    {
      id: `${chapterId}-record-10`,
      chapterId,
      actorUserId: "u-aki",
      event: {
        kind: "stage_transitioned",
        data: {
          stage: "translate",
          previousPhase: "active",
          nextPhase: "completed",
          origin: "translation_import",
        },
      },
      createdAt: now - 1000 * 60 * 4,
    },
    {
      id: `${chapterId}-record-9`,
      chapterId,
      actorUserId: "u-aki",
      event: {
        kind: "translation_exported",
        data: { formats: { labelPlus: true, poprako: true } },
      },
      createdAt: now - 1000 * 60 * 18,
    },
    {
      id: `${chapterId}-record-8`,
      chapterId,
      actorUserId: "u-aki",
      event: {
        kind: "translation_imported",
        data: {
          format: "poprako",
          importedPageCount: 25,
          importedUnitCount: 186,
        },
      },
      createdAt: now - 1000 * 60 * 32,
    },
    {
      id: `${chapterId}-record-7`,
      chapterId,
      actorUserId: "u-admin",
      event: {
        kind: "assignment_deleted",
        data: { subjectUserId: "u-former", previousRoles: 4 },
      },
      createdAt: now - 1000 * 60 * 51,
    },
    {
      id: `${chapterId}-record-6`,
      chapterId,
      actorUserId: "u-admin",
      event: {
        kind: "assignment_roles_updated",
        data: {
          subjectUserId: "u-aki",
          previousRoles: 2,
          nextRoles: 6,
        },
      },
      createdAt: now - 1000 * 60 * 76,
    },
    {
      id: `${chapterId}-record-5`,
      chapterId,
      actorUserId: "u-admin",
      event: {
        kind: "assignment_created",
        data: { subjectUserId: "u-aki", roles: 2 },
      },
      createdAt: now - 1000 * 60 * 105,
    },
    {
      id: `${chapterId}-record-4`,
      chapterId,
      actorUserId: "u-admin",
      event: { kind: "chapter_unpinned" },
      createdAt: now - 1000 * 60 * 144,
    },
    {
      id: `${chapterId}-record-3`,
      chapterId,
      actorUserId: "u-admin",
      event: { kind: "chapter_pinned" },
      createdAt: now - 1000 * 60 * 175,
    },
    {
      id: `${chapterId}-record-2`,
      chapterId,
      actorUserId: "u-admin",
      event: {
        kind: "chapter_subtitle_updated",
        data: { previousSubtitle: "", nextSubtitle: "深渊回响" },
      },
      createdAt: now - 1000 * 60 * 220,
    },
    {
      id: `${chapterId}-record-${String(1)}`,
      chapterId,
      actorUserId: null,
      event: { kind: "chapter_created" },
      createdAt: now - 1000 * 60 * 260,
    },
  ];
}
