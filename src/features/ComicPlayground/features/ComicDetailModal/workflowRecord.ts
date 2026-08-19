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

const PHASE_LABELS: Record<ChapterWorkflowRecordPhase, string> = {
  pending: "待开始",
  active: "进行中",
  completed: "已完成",
};

const ORIGIN_LABELS: Record<ChapterWorkflowRecordOrigin, string> = {
  manual: "",
  unit_edit: "单元编辑",
  translation_import: "翻译导入",
  translation_export: "翻译导出",
  raw_provide_check: "图源检查",
};

const FORMAT_LABELS: Record<ChapterWorkflowRecordTranslationFormat, string> = {
  label_plus: "LabelPlus",
  poprako: "PopRaKo",
};

function assertNever(value: never): never {
  throw new Error(`Unsupported workflow record event: ${JSON.stringify(value)}`);
}

function roleLabels(mask: number): string {
  const labels = unmaskRoles(mask).map((role) => ROLE_LABELS[role]);
  return labels.length > 0 ? labels.join("、") : "未分配角色";
}

function subtitleLabel(value: string): string {
  return value.trim() || "无副标题";
}

function stageTransitionText(
  event: Extract<ChapterWorkflowRecordEvent, { kind: "stage_transitioned" }>,
): string {
  const { stage, previousPhase, nextPhase, origin } = event.data;
  const reason = ORIGIN_LABELS[origin];
  const prefix = reason ? `因${reason}，` : "";
  return (
    `${prefix}${STAGE_LABELS[stage]}阶段从` +
    `“${PHASE_LABELS[previousPhase]}”变为“${PHASE_LABELS[nextPhase]}”`
  );
}

export function shortWorkflowRecordUserId(userId: string): string {
  if (userId.length <= 12) return userId;
  return `${userId.slice(0, 6)}…${userId.slice(-4)}`;
}

export function formatWorkflowRecordEvent(
  event: ChapterWorkflowRecordEvent,
  userLabel: UserLabel = shortWorkflowRecordUserId,
): string {
  switch (event.kind) {
    case "chapter_created":
      return "创建了章节";
    case "chapter_subtitle_updated":
      return (
        `将章节副标题从“${subtitleLabel(event.data.previousSubtitle)}”` +
        `修改为“${subtitleLabel(event.data.nextSubtitle)}”`
      );
    case "chapter_pinned":
      return "将章节设为置顶";
    case "chapter_unpinned":
      return "取消了章节置顶";
    case "assignment_created":
      return (
        `为 ${userLabel(event.data.subjectUserId)} 分配了` +
        `${roleLabels(event.data.roles)}分工`
      );
    case "assignment_roles_updated":
      return (
        `将 ${userLabel(event.data.subjectUserId)} 的分工从` +
        `“${roleLabels(event.data.previousRoles)}”调整为` +
        `“${roleLabels(event.data.nextRoles)}”`
      );
    case "assignment_deleted":
      return (
        `移除了 ${userLabel(event.data.subjectUserId)} 的` +
        `${roleLabels(event.data.previousRoles)}分工`
      );
    case "translation_imported":
      return (
        `导入了 ${FORMAT_LABELS[event.data.format]} 数据（` +
        `${event.data.importedPageCount} 页，` +
        `${event.data.importedUnitCount} 个单元）`
      );
    case "translation_exported":
      return `导出了 ${FORMAT_LABELS[event.data.format]} 数据`;
    case "stage_transitioned":
      return stageTransitionText(event);
    default:
      return assertNever(event);
  }
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
