import {
  deleteAssignment,
  listAssignmentsByChapter,
  upsertAssignment,
} from "@/routes/_authenticated/business/assignment/assignment-request";
import { assignmentRoles } from "@/routes/_authenticated/business/assignment/assignment";
import {
  createChapter,
  deleteChapter,
  exportChapter,
  importChapter,
  joinChapter,
  listChapters,
  listChapterWorkflowRecords,
  updateChapter,
} from "@/routes/_authenticated/business/chapter/chapter-request";
import {
  allocExistingPageUpload,
  deleteChapterPages,
  listPages,
} from "@/routes/_authenticated/business/page/page-request";
import { getUser } from "@/routes/business/identity/user-request";
import { roleMask } from "@/routes/business/identity/role";
import type { Role } from "@/routes/business/identity/role";
import type { Result } from "@/shared/utility/result";
import type { AssignmentInfo } from "@/routes/_authenticated/business/assignment/assignment";
import type { WorkflowTransition } from "@/routes/_authenticated/business/chapter/chapter-input";
import type { ComicDetailModalProps } from "./comic-detail-type";
import { addChapterPages } from "./upload/page-upload";

type Action = Required<ComicDetailModalProps>;
export type DetailActions = {
  onLoadChapters: Action["onLoadChapters"];
  onLoadAssignments: Action["onLoadAssignments"];
  onLoadPages: Action["onLoadPages"];
  onLoadWorkflowRecords: Action["onLoadWorkflowRecords"];
  onResolveWorkflowRecordUser: Action["onResolveWorkflowRecordUser"];
  onTransiteWorkflow: Action["onTransiteWorkflow"];
  onRemoveAssignment: NonNullable<Action["onRemoveAssignment"]>;
  onAddAssignment: NonNullable<Action["onAddAssignment"]>;
  onCreateChapter: NonNullable<Action["onCreateChapter"]>;
  onDeleteChapter: NonNullable<Action["onDeleteChapter"]>;
  onAddPages: NonNullable<Action["onAddPages"]>;
  onDeleteChapterPages: NonNullable<Action["onDeleteChapterPages"]>;
  onAllocPageUpload: NonNullable<Action["onAllocPageUpload"]>;
  onJoinChapterRole: NonNullable<Action["onJoinChapterRole"]>;
  onImportChapter: Action["onImportChapter"];
  onExportChapter: NonNullable<Action["onExportChapter"]>;
};

export function loadDetailAssignments(chapterId: string): Promise<Result<AssignmentInfo[]>> {
  return listAssignmentsByChapter({
    chapterId,
    offset: 0,
    limit: 20,
    includes: ["user"],
  });
}

export function transitionDetailWorkflow(
  chapterId: string,
  transition: WorkflowTransition,
): Promise<Result<void>> {
  return updateChapter(
    chapterId,
    transition.endsWith("_revert")
      ? { revertTransition: transition }
      : { workflowTransition: transition },
  );
}

export async function addDetailAssignment(
  chapterId: string,
  userId: string,
  role: Role,
): Promise<Result<void>> {
  const result = await loadDetailAssignments(chapterId);
  if (!result.success) return result;
  const existing = result.data.find((assignment) => assignment.userId === userId);
  const roles = existing ? [...new Set([...assignmentRoles(existing), role])] : [role];
  const saved = await upsertAssignment({
    chapterId,
    userId,
    roles: roleMask(roles),
  });
  if (!saved.success) return saved;
  return { success: true, data: undefined };
}

export async function removeDetailAssignment(
  chapterId: string,
  userId: string,
  role: Role,
): Promise<Result<void>> {
  const result = await loadDetailAssignments(chapterId);
  if (!result.success) return result;
  const assignment = result.data.find((item) => item.userId === userId);
  if (!assignment) return { success: false, error: "未找到对应分工记录" };
  const remaining = assignmentRoles(assignment).filter((item) => item !== role);
  const saved =
    remaining.length === 0
      ? await deleteAssignment(assignment.id)
      : await upsertAssignment({ chapterId, userId, roles: roleMask(remaining) });
  if (!saved.success) return saved;
  return { success: true, data: undefined };
}

export function createDetailActions({ logPrefix }: { logPrefix: string }): DetailActions {
  return {
    onLoadChapters: listChapters,
    onLoadAssignments: loadDetailAssignments,
    onLoadPages: loadDetailPages,
    onLoadWorkflowRecords: listChapterWorkflowRecords,
    onResolveWorkflowRecordUser: getUser,
    onTransiteWorkflow: transitionDetailWorkflow,
    onRemoveAssignment: removeDetailAssignment,
    onAddAssignment: addDetailAssignment,
    onCreateChapter: createChapter,
    onDeleteChapter: deleteChapter,
    onAddPages: (chapterId, files, callbacks) =>
      addDetailPages({ chapterId, files, callbacks, logPrefix }),
    onDeleteChapterPages: deleteChapterPages,
    onAllocPageUpload: allocExistingPageUpload,
    onJoinChapterRole: joinDetailRole,
    onImportChapter: importChapter,
    onExportChapter: exportChapter,
  };
}

function loadDetailPages(chapterId: string): ReturnType<DetailActions["onLoadPages"]> {
  return listPages({ chapterId });
}

function addDetailPages(args: Parameters<typeof addChapterPages>[0]): Promise<void> {
  return addChapterPages(args);
}

function joinDetailRole(chapterId: string, role: Role): Promise<Result<void>> {
  return joinChapter(chapterId, roleMask([role]));
}
