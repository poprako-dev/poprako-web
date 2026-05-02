import { useState } from "react";
import clsx from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import {
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
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Props = {
  selectedChapter?: ChapterInfo;
  assignments: AssignmentInfo[];
  onTransiteWorkflow: (transition: WorkflowTransition) => Promise<Result<void>>;
  onRemoveAssignment?: (userId: string) => void;
  onAddAssignment?: (role: Role) => void;
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
};

const ROLE_DEFS: RoleDef[] = [
  {
    label: "图",
    addRole: "rawProvider",
    matches: (a) => a.assignedRawProviderAt !== undefined,
    getStatus: uploadWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "upload_complete"),
  },
  {
    label: "翻",
    addRole: "translator",
    matches: (a) => a.assignedTranslatorAt !== undefined,
    getStatus: translateWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "translate_start";
      if (s === "ongoing") return "translate_complete";
      return null;
    },
  },
  {
    label: "校",
    addRole: "proofreader",
    matches: (a) => a.assignedProofreaderAt !== undefined,
    getStatus: proofreadWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "proofread_start";
      if (s === "ongoing") return "proofread_complete";
      return null;
    },
  },
  {
    // 嵌字 and 美工 share the same typeset workflow stage.
    label: "嵌",
    addRole: "typesetter",
    matches: (a) =>
      a.assignedTypesetterAt !== undefined ||
      a.assignedRedrawerAt !== undefined,
    getStatus: typesetWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "typeset_start";
      if (s === "ongoing") return "typeset_complete";
      return null;
    },
  },
  {
    label: "监",
    addRole: "reviewer",
    matches: (a) => a.assignedReviewerAt !== undefined,
    getStatus: reviewWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "review_complete"),
  },
  {
    label: "传",
    addRole: "publisher",
    matches: (a) => a.assignedPublisherAt !== undefined,
    getStatus: publishWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "publish_complete"),
  },
];

const TRANSITION_LABELS: Record<WorkflowTransition, string> = {
  upload_complete: "标记图源上传完成",
  translate_start: "开始翻译",
  translate_complete: "标记翻译完成",
  proofread_start: "开始校对",
  proofread_complete: "标记校对完成",
  typeset_start: "开始嵌字",
  typeset_complete: "标记嵌字完成",
  review_complete: "标记审核通过",
  publish_complete: "标记发布完成",
};

type PendingConfirm = {
  transition: WorkflowTransition;
  resolve: (result: Result<void>) => void;
};

export default function AssignmentFooter({
  selectedChapter,
  assignments,
  onTransiteWorkflow,
  onRemoveAssignment,
  onAddAssignment,
  canOperateWorkflow = false,
  canManageAssignments = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const handleRequestTransition = (
    transition: WorkflowTransition,
  ): Promise<Result<void>> => {
    return new Promise((resolve) => {
      setPendingConfirm({ transition, resolve });
    });
  };

  const handleConfirm = async () => {
    if (!pendingConfirm) return;
    const { transition, resolve } = pendingConfirm;
    setPendingConfirm(null);
    resolve(await onTransiteWorkflow(transition));
  };

  const handleCancelConfirm = () => {
    if (!pendingConfirm) return;
    pendingConfirm.resolve({ success: false, error: "用户取消" });
    setPendingConfirm(null);
  };

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
          <ChevronUp className="w-4 h-4" strokeWidth={2} />
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
            const status = selectedChapter
              ? roleDef.getStatus(selectedChapter)
              : ("pending" as WorkflowStatus);
            const transition = roleDef.nextTransition(status);

            return (
              <RoleTag
                key={roleDef.label}
                label={roleDef.label}
                assignments={roleAssignments}
                status={status}
                transition={canOperateWorkflow ? transition : null}
                onTransiteWorkflow={handleRequestTransition}
                onRemoveUser={canManageAssignments ? onRemoveAssignment : undefined}
                onAddUser={
                  canManageAssignments && onAddAssignment
                    ? () => onAddAssignment(roleDef.addRole)
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>

      {pendingConfirm && (
        <ConfirmDialog
          title="确认推进流程"
          description={`即将执行：${TRANSITION_LABELS[pendingConfirm.transition]}，此操作不可撤销。`}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}
    </div>
  );
}

