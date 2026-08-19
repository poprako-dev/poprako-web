import type {
  ChapterWorkflowRecord,
  ChapterWorkflowRecordEvent,
  ChapterWorkflowRecordOrigin,
  ChapterWorkflowRecordPhase,
  ChapterWorkflowRecordStage,
  ChapterWorkflowRecordTranslationFormat,
} from "@/types/chapterWorkflowRecord";
import { unmaskRoles, type Role } from "@/types/role";

type UserLabel = (userId: string) => string;

export type WorkflowRecordTextPart = {
  text: string;
  variable: boolean;
};

export type WorkflowRecordEventPresentation = {
  title: WorkflowRecordTextPart[];
  detail: WorkflowRecordTextPart[];
};

const ROLE_LABELS: Record<Role, string> = {
  rawProvider: "图源",
  translator: "翻译",
  proofreader: "校对",
  typesetter: "嵌字",
  redrawer: "美工",
  reviewer: "监修",
  publisher: "发布",
  admin: "总管",
};

const STAGE_LABELS: Record<ChapterWorkflowRecordStage, string> = {
  raw_provide: "图源",
  translate: "翻译",
  proofread: "校对",
  typeset_redraw: "嵌字",
  review: "监修",
  publish: "发布",
};

const PHASE_TITLE_LABELS: Record<ChapterWorkflowRecordPhase, string> = {
  pending: "待开始",
  active: "已开始",
  completed: "已完成",
};

const FORMAT_LABELS: Record<ChapterWorkflowRecordTranslationFormat, string> = {
  label_plus: "LabelPlus",
  poprako: "PopRaKo",
};

function assertNever(value: never): never {
  throw new Error(`Unsupported workflow record event: ${JSON.stringify(value)}`);
}

function fixed(text: string): WorkflowRecordTextPart {
  return { text, variable: false };
}

function variable(text: string): WorkflowRecordTextPart {
  return { text, variable: true };
}

function roleLabels(mask: number): string {
  const labels = unmaskRoles(mask).map((role) => ROLE_LABELS[role]);
  return labels.length > 0 ? labels.join("、") : "未分配角色";
}

function subtitleLabel(value: string): string {
  return value.trim() || "无副标题";
}

function stageOriginLabel(
  origin: ChapterWorkflowRecordOrigin,
  stage: ChapterWorkflowRecordStage,
): string {
  switch (origin) {
    case "manual":
      return "手动推进";
    case "unit_edit":
      return `${STAGE_LABELS[stage]}翻校单元推进`;
    case "translation_import":
      return "翻校数据导入推进";
    case "translation_export":
      return "翻校数据导出推进";
    case "raw_provide_check":
      return "图源完整性检查推进";
    default:
      return assertNever(origin);
  }
}

function stageTransitionPresentation(
  event: Extract<ChapterWorkflowRecordEvent, { kind: "stage_transitioned" }>,
): WorkflowRecordEventPresentation {
  const { stage, nextPhase, origin } = event.data;
  return {
    title: [
      variable(STAGE_LABELS[stage]),
      fixed("阶段"),
      variable(PHASE_TITLE_LABELS[nextPhase]),
    ],
    detail: [variable(stageOriginLabel(origin, stage))],
  };
}

export function shortWorkflowRecordUserId(userId: string): string {
  if (userId.length <= 12) return userId;
  return `${userId.slice(0, 6)}…${userId.slice(-4)}`;
}

export function presentWorkflowRecordEvent(
  event: ChapterWorkflowRecordEvent,
  userLabel: UserLabel = shortWorkflowRecordUserId,
): WorkflowRecordEventPresentation {
  switch (event.kind) {
    case "chapter_created":
      return { title: [fixed("章节创建")], detail: [fixed("创建了章节")] };
    case "chapter_subtitle_updated":
      return {
        title: [fixed("章节副标题修改")],
        detail: [
          fixed("将“"),
          variable(subtitleLabel(event.data.previousSubtitle)),
          fixed("”修改为“"),
          variable(subtitleLabel(event.data.nextSubtitle)),
          fixed("”"),
        ],
      };
    case "chapter_pinned":
      return { title: [fixed("章节置顶")], detail: [fixed("设为置顶章节")] };
    case "chapter_unpinned":
      return { title: [fixed("取消章节置顶")], detail: [fixed("取消置顶")] };
    case "assignment_created":
      return {
        title: [fixed("章节分工添加")],
        detail: [
          fixed("为 "),
          variable(userLabel(event.data.subjectUserId)),
          fixed(" 添加了"),
          variable(roleLabels(event.data.roles)),
          fixed("分工"),
        ],
      };
    case "assignment_roles_updated":
      return {
        title: [fixed("章节分工调整")],
        detail: [
          fixed("将 "),
          variable(userLabel(event.data.subjectUserId)),
          fixed(" 的分工由“"),
          variable(roleLabels(event.data.previousRoles)),
          fixed("”调整为“"),
          variable(roleLabels(event.data.nextRoles)),
          fixed("”"),
        ],
      };
    case "assignment_deleted":
      return {
        title: [fixed("章节分工移除")],
        detail: [
          fixed("移除了 "),
          variable(userLabel(event.data.subjectUserId)),
          fixed(" 的"),
          variable(roleLabels(event.data.previousRoles)),
          fixed("分工"),
        ],
      };
    case "translation_imported":
      return {
        title: [fixed("翻校数据导入")],
        detail: [
          fixed("以 "),
          variable(FORMAT_LABELS[event.data.format]),
          fixed(" 格式导入了 "),
          variable(String(event.data.importedPageCount)),
          fixed(" 页，共 "),
          variable(String(event.data.importedUnitCount)),
          fixed(" 个翻校单元"),
        ],
      };
    case "translation_exported":
      return {
        title: [fixed("翻校数据导出")],
        detail: [
          fixed("以 "),
          variable(FORMAT_LABELS[event.data.format]),
          fixed(" 格式导出"),
        ],
      };
    case "stage_transitioned":
      return stageTransitionPresentation(event);
    default:
      return assertNever(event);
  }
}

function textFromParts(parts: WorkflowRecordTextPart[]): string {
  return parts.map(({ text }) => text).join("");
}

export function formatWorkflowRecordEvent(
  event: ChapterWorkflowRecordEvent,
  userLabel: UserLabel = shortWorkflowRecordUserId,
): string {
  const presentation = presentWorkflowRecordEvent(event, userLabel);
  return (
    `${textFromParts(presentation.title)}：` +
    textFromParts(presentation.detail)
  );
}

export function formatWorkflowRecordTime(
  timestamp: number,
  currentYear = new Date().getFullYear(),
): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const datePart = year === currentYear
    ? `${month}月${day}日`
    : `${year}年${month}月${day}日`;
  return `${datePart} ${hour}:${minute}`;
}

export function workflowRecordUserIds(
  record: ChapterWorkflowRecord,
): string[] {
  const ids = record.actorUserId ? [record.actorUserId] : [];
  const { event } = record;

  switch (event.kind) {
    case "assignment_created":
    case "assignment_roles_updated":
    case "assignment_deleted":
      return Array.from(new Set([...ids, event.data.subjectUserId]));
    case "chapter_created":
    case "chapter_subtitle_updated":
    case "chapter_pinned":
    case "chapter_unpinned":
    case "translation_imported":
    case "translation_exported":
    case "stage_transitioned":
      return ids;
    default:
      return assertNever(event);
  }
}
