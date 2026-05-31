import { useState } from "react";
import clsx from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import {
  canApplyWorkflowTransition,
  uploadWorkflowStatus,
  translateWorkflowStatus,
  proofreadWorkflowStatus,
  typesetWorkflowStatus,
  reviewWorkflowStatus,
  publishWorkflowStatus,
} from "@/types/chapter";
import type { ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { WorkflowStatus } from "@/types/workflow";
import type { Result } from "@/types/utils/result";
import RoleTag from "./RoleTag";
import type { Role } from "@/types/role";

type Props = {
  selectedChapter?: ChapterInfo;
  assignments: AssignmentInfo[];
  currentUserId?: string | null;
  onTransiteWorkflow: (transition: WorkflowTransition) => Promise<Result<void>>;
  onRemoveAssignment?: (userId: string, role: Role) => void;
  onAddAssignment?: (role: Role) => void;
  onJoinRole?: (role: Role) => void;
  canJoinRole?: (role: Role) => boolean;
  isRoleJoining?: (role: Role) => boolean;
  onLeaveRole?: (role: Role) => void;
  canLeaveRole?: (role: Role) => boolean;
  isRoleLeaving?: (role: Role) => boolean;
  canOperateWorkflow?: boolean;
  canManageAssignments?: boolean;
};

type RoleDef = {
  label: string;
  /** Returns the role key used when adding a new assignment for this row. */
  addRole: Role;
  /** Predicate to check if an assignment belongs to this row. */
  matches: (a: AssignmentInfo) => boolean;
  getStatus: (ch: ChapterInfo) => WorkflowStatus;
  nextTransition: (status: WorkflowStatus) => WorkflowTransition | null;
  prevRevertTransition: (ch: ChapterInfo) => WorkflowTransition | null;
};

const ROLE_DEFS: RoleDef[] = [
  {
    label: "图",
    addRole: "rawProvider",
    matches: (a) => a.assignedRawProviderAt != null,
    getStatus: uploadWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "upload_complete"),
    prevRevertTransition: (ch) => (ch.uploadedAt ? "upload_revert" : null),
  },
  {
    label: "翻",
    addRole: "translator",
    matches: (a) => a.assignedTranslatorAt != null,
    getStatus: translateWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "translate_start";
      if (s === "ongoing") return "translate_complete";
      return null;
    },
    prevRevertTransition: (ch) => {
      if (ch.translatedAt) return "translate_revert";
      if (ch.translatingAt) return "translate_start_revert";
      return null;
    },
  },
  {
    label: "校",
    addRole: "proofreader",
    matches: (a) => a.assignedProofreaderAt != null,
    getStatus: proofreadWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "proofread_start";
      if (s === "ongoing") return "proofread_complete";
      return null;
    },
    prevRevertTransition: (ch) => {
      if (ch.proofreadAt) return "proofread_revert";
      if (ch.proofreadingAt) return "proofread_start_revert";
      return null;
    },
  },
  {
    // 嵌字 and 美工 share the same typeset workflow stage.
    label: "嵌",
    addRole: "typesetter",
    matches: (a) =>
      a.assignedTypesetterAt != null ||
      a.assignedRedrawerAt != null,
    getStatus: typesetWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "typeset_start";
      if (s === "ongoing") return "typeset_complete";
      return null;
    },
    prevRevertTransition: (ch) => {
      if (ch.typesetAt) return "typeset_revert";
      if (ch.typesettingAt) return "typeset_start_revert";
      return null;
    },
  },
  {
    label: "监",
    addRole: "reviewer",
    matches: (a) => a.assignedReviewerAt != null,
    getStatus: reviewWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "review_complete"),
    prevRevertTransition: (ch) => (ch.reviewedAt ? "review_revert" : null),
  },
  {
    label: "传",
    addRole: "publisher",
    matches: (a) => a.assignedPublisherAt != null,
    getStatus: publishWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "publish_complete"),
    prevRevertTransition: () => null,
  },
];

export const TRANSITION_LABELS: Record<WorkflowTransition, string> = {
  upload_complete: "标记图源上传完成",
  translate_start: "开始翻译",
  translate_complete: "标记翻译完成",
  proofread_start: "开始校对",
  proofread_complete: "标记校对完成",
  typeset_start: "开始嵌字",
  typeset_complete: "标记嵌字完成",
  review_complete: "标记审核通过",
  publish_complete: "标记发布完成",
  upload_revert: "撤销上传完成",
  translate_start_revert: "撤销开始翻译",
  translate_revert: "撤销翻译完成",
  proofread_start_revert: "撤销开始校对",
  proofread_revert: "撤销校对完成",
  typeset_start_revert: "撤销开始嵌字",
  typeset_revert: "撤销嵌字完成",
  review_revert: "撤销审核通过",
};

export default function AssignmentFooter({
  selectedChapter,
  assignments,
  currentUserId,
  onTransiteWorkflow,
  onRemoveAssignment,
  onAddAssignment,
  onJoinRole,
  canJoinRole,
  isRoleJoining,
  onLeaveRole,
  canLeaveRole,
  isRoleLeaving,
  canOperateWorkflow = false,
  canManageAssignments = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col border-t border-slate-200 bg-white shrink-0">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full h-5 flex items-center justify-center",
          "text-slate-300 hover:text-slate-500 hover:bg-slate-100/50",
          "transition-colors",
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" strokeWidth={2} />
        ) : (
          <ChevronUp className="w-4 h-4 stone-800" strokeWidth={2} />
        )}
      </button>

      {/* Expanded Content */}
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-4 pt-1 pb-3 flex flex-col gap-1 relative">
          {ROLE_DEFS.map((roleDef) => {
            const roleAssignments = assignments.filter(roleDef.matches);
            const isCurrentUserAssigned = !!(
              currentUserId &&
              roleAssignments.some((a) => a.userId === currentUserId)
            );
            const canOperateThisRole =
              canOperateWorkflow || isCurrentUserAssigned;
            const status = selectedChapter
              ? roleDef.getStatus(selectedChapter)
              : ("unset" as WorkflowStatus);

            // forward transition
            const nextForward =
              selectedChapter && status !== "unset"
                ? roleDef.nextTransition(status)
                : null;
            const forwardTransition =
              canOperateThisRole &&
              selectedChapter &&
              nextForward &&
              canApplyWorkflowTransition(selectedChapter, nextForward)
                ? nextForward
                : null;

            // revert transition
            const nextRevert =
              selectedChapter
                ? roleDef.prevRevertTransition(selectedChapter)
                : null;
            const revertTransition =
              canOperateThisRole &&
              selectedChapter &&
              nextRevert &&
              canApplyWorkflowTransition(selectedChapter, nextRevert)
                ? nextRevert
                : null;

            const hasAnyTransition =
              forwardTransition != null || revertTransition != null;

            return (
              <RoleTag
                key={roleDef.label}
                label={roleDef.label}
                role={roleDef.addRole}
                assignments={roleAssignments}
                status={status}
                forwardTransition={forwardTransition}
                revertTransition={revertTransition}
                onClickable={hasAnyTransition}
                onTransiteWorkflow={onTransiteWorkflow}
                onRemoveUser={canManageAssignments ? onRemoveAssignment : undefined}
                onAddUser={
                  canManageAssignments && onAddAssignment
                    ? () => onAddAssignment(roleDef.addRole)
                    : undefined
                }
                canJoinSelf={
                  canJoinRole ? canJoinRole(roleDef.addRole) : false
                }
                isJoiningSelf={
                  isRoleJoining ? isRoleJoining(roleDef.addRole) : false
                }
                onJoinSelf={
                  onJoinRole ? () => onJoinRole(roleDef.addRole) : undefined
                }
                canLeaveSelf={
                  canLeaveRole ? canLeaveRole(roleDef.addRole) : false
                }
                isLeavingSelf={
                  isRoleLeaving ? isRoleLeaving(roleDef.addRole) : false
                }
                onLeaveSelf={
                  onLeaveRole ? () => onLeaveRole(roleDef.addRole) : undefined
                }
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}

