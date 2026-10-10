import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import {
  proofreadWorkflowStatus,
  publishWorkflowStatus,
  reviewWorkflowStatus,
  translateWorkflowStatus,
  typesetWorkflowStatus,
  uploadWorkflowStatus,
} from "@/route/_authenticated/business/chapter/chapter";
import type { WorkflowStatus } from "@/route/_authenticated/business/chapter/workflow";

export const WORKFLOW_STEPS = [
  { label: "图", field: "rawProvider" as const, getStatus: uploadWorkflowStatus },
  { label: "翻", field: "translator" as const, getStatus: translateWorkflowStatus },
  { label: "校", field: "proofreader" as const, getStatus: proofreadWorkflowStatus },
  { label: "嵌", field: "typesetter" as const, getStatus: typesetWorkflowStatus },
  { label: "监", field: "reviewer" as const, getStatus: reviewWorkflowStatus },
  { label: "传", field: "publisher" as const, getStatus: publishWorkflowStatus },
];

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

export const STATUS_CONFIG: Record<WorkflowStatus, { text: string; bg: string; dot: string }> = {
  pending: {
    text: "text-text-muted-cool",
    bg: "bg-surface-slate-50",
    dot: "bg-surface-slate-200",
  },
  ongoing: {
    text: "text-text-warning",
    bg: "bg-surface-orange-50",
    dot: "bg-surface-orange-300",
  },
  completed: {
    text: "text-text-emerald",
    bg: "bg-surface-emerald-50",
    dot: "bg-surface-emerald-400",
  },
  unset: {
    text: "text-text-muted-cool",
    bg: "bg-surface-slate-50",
    dot: "bg-surface-slate-200",
  },
};

export const ROLE_NAMES: Record<string, string> = {
  图: "图源",
  翻: "翻译",
  校: "校对",
  嵌: "嵌字",
  监: "监修",
  传: "上传",
};

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: "待开始",
  ongoing: "进行中",
  completed: "已完成",
  unset: "未设置",
};

export function workflowStatus(step: WorkflowStep, chapter: ChapterInfo | null): WorkflowStatus {
  return chapter ? step.getStatus(chapter) : "pending";
}
