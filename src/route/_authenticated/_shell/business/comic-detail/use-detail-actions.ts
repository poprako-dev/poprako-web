import {
  deleteAssignment,
  listAssignmentsByChapter,
  upsertAssignment,
} from "@/route/_authenticated/business/assignment/assignment-request";
import { assignmentRoles } from "@/route/_authenticated/business/assignment/assignment";
import {
  createChapter,
  deleteChapter,
  exportChapter,
  importChapter,
  joinChapter,
  listChapters,
  listChapterWorkflowRecords,
  updateChapter,
} from "@/route/_authenticated/business/chapter/chapter-request";
import { deleteChapterPages, listPages } from "@/route/_authenticated/business/page/page-request";
import { getUser } from "@/route/business/identity/user-request";
import { roleMask } from "@/route/business/identity/role";
import type { Role } from "@/route/business/identity/role";
import type { Result } from "@/shared/utility/result";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { WorkflowTransition } from "@/route/_authenticated/business/chapter/chapter-input";
import type { DetailContract } from "./comic-detail-type";
import type { ApiClient } from "@/api/client";

type Action = Required<DetailContract>;
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
  onDeleteChapterPages: NonNullable<Action["onDeleteChapterPages"]>;
  onJoinChapterRole: NonNullable<Action["onJoinChapterRole"]>;
  onImportChapter: Action["onImportChapter"];
  onExportChapter: NonNullable<Action["onExportChapter"]>;
};

export function loadDetailAssignments(
  client: ApiClient,
  chapterId: string,
): Promise<Result<AssignmentInfo[]>> {
  return listAssignmentsByChapter(client, {
    chapterId,
    offset: 0,
    limit: 20,
    includes: ["user"],
  });
}

export function transitionDetailWorkflow(
  client: ApiClient,
  chapterId: string,
  transition: WorkflowTransition,
): Promise<Result<void>> {
  return updateChapter(
    client,
    chapterId,
    transition.endsWith("_revert")
      ? { revertTransition: transition }
      : { workflowTransition: transition },
  );
}

export async function addDetailAssignment(
  client: ApiClient,
  chapterId: string,
  userId: string,
  role: Role,
): Promise<Result<void>> {
  const result = await loadDetailAssignments(client, chapterId);
  if (!result.success) return result;
  const existing = result.data.find((assignment) => assignment.userId === userId);
  const roles = existing ? [...new Set([...assignmentRoles(existing), role])] : [role];
  const saved = await upsertAssignment(client, {
    chapterId,
    userId,
    roles: roleMask(roles),
  });
  if (!saved.success) return saved;
  return { success: true, data: undefined };
}

export async function removeDetailAssignment(
  client: ApiClient,
  chapterId: string,
  userId: string,
  role: Role,
): Promise<Result<void>> {
  const result = await loadDetailAssignments(client, chapterId);
  if (!result.success) return result;
  const assignment = result.data.find((item) => item.userId === userId);
  if (!assignment) return { success: false, error: "未找到对应分工记录" };
  const remaining = assignmentRoles(assignment).filter((item) => item !== role);
  const saved =
    remaining.length === 0
      ? await deleteAssignment(client, assignment.id)
      : await upsertAssignment(client, { chapterId, userId, roles: roleMask(remaining) });
  if (!saved.success) return saved;
  return { success: true, data: undefined };
}

export function createDetailActions(client: ApiClient): DetailActions {
  return {
    onLoadChapters: (...args) => listChapters(client, ...args),
    onLoadAssignments: (...args) => loadDetailAssignments(client, ...args),
    onLoadPages: (chapterId) => loadDetailPages(client, chapterId),
    onLoadWorkflowRecords: (...args) => listChapterWorkflowRecords(client, ...args),
    onResolveWorkflowRecordUser: (userId) => getUser(client, userId),
    onTransiteWorkflow: (...args) => transitionDetailWorkflow(client, ...args),
    onRemoveAssignment: (...args) => removeDetailAssignment(client, ...args),
    onAddAssignment: (...args) => addDetailAssignment(client, ...args),
    onCreateChapter: (...args) => createChapter(client, ...args),
    onDeleteChapter: (...args) => deleteChapter(client, ...args),
    onDeleteChapterPages: (chapterId) => deleteChapterPages(client, chapterId),
    onJoinChapterRole: (...args) => joinDetailRole(client, ...args),
    onImportChapter: (...args) => importChapter(client, ...args),
    onExportChapter: (...args) => exportChapter(client, ...args),
  };
}

function loadDetailPages(
  client: ApiClient,
  chapterId: string,
): ReturnType<DetailActions["onLoadPages"]> {
  return listPages(client, { chapterId });
}

function joinDetailRole(client: ApiClient, chapterId: string, role: Role): Promise<Result<void>> {
  return joinChapter(client, chapterId, roleMask([role]));
}
