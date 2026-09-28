import type { WorkflowTransition } from "@/routes/_authenticated/business/chapter/chapter-input";
import {
  proofreadWorkflowStatus,
  publishWorkflowStatus,
  reviewWorkflowStatus,
  translateWorkflowStatus,
  typesetWorkflowStatus,
  uploadWorkflowStatus,
} from "@/routes/_authenticated/business/chapter/chapter";
import type { ChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/routes/_authenticated/business/assignment/assignment";
import type { Role } from "@/routes/business/identity/role";
import type { WorkflowStatus } from "@/routes/_authenticated/business/chapter/workflow";

export type AssignmentRoleDef = {
  fullLabel: string;
  shortLabel: string;
  addRole: Role;
  matches: (assignment: AssignmentInfo) => boolean;
  getStatus: (chapter: ChapterInfo) => WorkflowStatus;
  nextTransition: (status: WorkflowStatus) => WorkflowTransition | null;
  prevRevertTransition: (chapter: ChapterInfo) => WorkflowTransition | null;
};

export const ASSIGNMENT_ROLE_DEFS: AssignmentRoleDef[] = [
  {
    fullLabel: "图源",
    shortLabel: "图",
    addRole: "rawProvider",
    matches: (assignment) => Boolean(assignment.assignedRawProviderAt),
    getStatus: uploadWorkflowStatus,
    nextTransition: (status) => (status === "completed" ? null : "upload_complete"),
    prevRevertTransition: (chapter) =>
      uploadWorkflowStatus(chapter) === "completed" ? "upload_revert" : null,
  },
  {
    fullLabel: "翻译",
    shortLabel: "翻",
    addRole: "translator",
    matches: (assignment) => Boolean(assignment.assignedTranslatorAt),
    getStatus: translateWorkflowStatus,
    nextTransition: (status) => {
      if (status === "pending") {
        return "translate_start";
      }
      if (status === "ongoing") {
        return "translate_complete";
      }
      return null;
    },
    prevRevertTransition: (chapter) => {
      const status = translateWorkflowStatus(chapter);
      if (status === "completed") {
        return "translate_revert";
      }
      if (status === "ongoing") {
        return "translate_start_revert";
      }
      return null;
    },
  },
  {
    fullLabel: "校对",
    shortLabel: "校",
    addRole: "proofreader",
    matches: (assignment) => Boolean(assignment.assignedProofreaderAt),
    getStatus: proofreadWorkflowStatus,
    nextTransition: (status) => {
      if (status === "pending") {
        return "proofread_start";
      }
      if (status === "ongoing") {
        return "proofread_complete";
      }
      return null;
    },
    prevRevertTransition: (chapter) => {
      const status = proofreadWorkflowStatus(chapter);
      if (status === "completed") {
        return "proofread_revert";
      }
      if (status === "ongoing") {
        return "proofread_start_revert";
      }
      return null;
    },
  },
  {
    fullLabel: "嵌字",
    shortLabel: "嵌",
    addRole: "typesetter",
    matches: (assignment) =>
      Boolean(assignment.assignedTypesetterAt ?? assignment.assignedRedrawerAt),
    getStatus: typesetWorkflowStatus,
    nextTransition: (status) => {
      if (status === "pending") {
        return "typeset_start";
      }
      if (status === "ongoing") {
        return "typeset_complete";
      }
      return null;
    },
    prevRevertTransition: (chapter) => {
      const status = typesetWorkflowStatus(chapter);
      if (status === "completed") {
        return "typeset_revert";
      }
      if (status === "ongoing") {
        return "typeset_start_revert";
      }
      return null;
    },
  },
  {
    fullLabel: "监修",
    shortLabel: "监",
    addRole: "reviewer",
    matches: (assignment) => Boolean(assignment.assignedReviewerAt),
    getStatus: reviewWorkflowStatus,
    nextTransition: (status) => (status === "completed" ? null : "review_complete"),
    prevRevertTransition: (chapter) =>
      reviewWorkflowStatus(chapter) === "completed" ? "review_revert" : null,
  },
  {
    fullLabel: "发布",
    shortLabel: "传",
    addRole: "publisher",
    matches: (assignment) => Boolean(assignment.assignedPublisherAt),
    getStatus: publishWorkflowStatus,
    nextTransition: (status) => (status === "completed" ? null : "publish_complete"),
    prevRevertTransition: () => null,
  },
];
