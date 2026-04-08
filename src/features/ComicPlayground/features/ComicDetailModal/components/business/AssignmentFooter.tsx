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

type Props = {
  selectedChapter?: ChapterInfo;
  assignments: AssignmentInfo[];
  onTransiteWorkflow: (transition: WorkflowTransition) => Promise<Result<void>>;
  onRemoveAssignment?: (userId: string) => void;
};

type RoleDef = {
  label: string;
  field: keyof Pick<
    AssignmentInfo,
    | "assignedRawProviderAt"
    | "assignedTranslatorAt"
    | "assignedProofreaderAt"
    | "assignedTypesetterAt"
    | "assignedReviewerAt"
    | "assignedPublisherAt"
  >;
  getStatus: (ch: ChapterInfo) => WorkflowStatus;
  nextTransition: (status: WorkflowStatus) => WorkflowTransition | null;
};

const ROLE_DEFS: RoleDef[] = [
  {
    label: "图",
    field: "assignedRawProviderAt",
    getStatus: uploadWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "upload_complete"),
  },
  {
    label: "翻",
    field: "assignedTranslatorAt",
    getStatus: translateWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "translate_start";
      if (s === "ongoing") return "translate_complete";
      return null;
    },
  },
  {
    label: "校",
    field: "assignedProofreaderAt",
    getStatus: proofreadWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "proofread_start";
      if (s === "ongoing") return "proofread_complete";
      return null;
    },
  },
  {
    label: "嵌",
    field: "assignedTypesetterAt",
    getStatus: typesetWorkflowStatus,
    nextTransition: (s) => {
      if (s === "pending") return "typeset_start";
      if (s === "ongoing") return "typeset_complete";
      return null;
    },
  },
  {
    label: "监",
    field: "assignedReviewerAt",
    getStatus: reviewWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "review_complete"),
  },
  {
    label: "传",
    field: "assignedPublisherAt",
    getStatus: publishWorkflowStatus,
    nextTransition: (s) => (s === "completed" ? null : "publish_complete"),
  },
];

export default function AssignmentFooter({
  selectedChapter,
  assignments,
  onTransiteWorkflow,
  onRemoveAssignment,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col border-t border-slate-200 bg-slate-50/30 shrink-0">
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
            const roleAssignments = assignments.filter(
              (a) => a[roleDef.field] !== undefined,
            );
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
                transition={transition}
                onTransiteWorkflow={onTransiteWorkflow}
                onRemoveUser={onRemoveAssignment}
                onAddUser={() => {
                  // TODO: open MemberSelectorModal
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
