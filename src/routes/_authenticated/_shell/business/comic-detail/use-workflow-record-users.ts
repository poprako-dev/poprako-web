import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssignmentInfo } from "@/routes/_authenticated/business/assignment/assignment";
import type { ChapterWorkflowRecord } from "@/routes/_authenticated/business/chapter/chapter-workflow-record";
import type { UserInfo } from "@/routes/business/identity/user";
import type { ComicDetailModalProps } from "@/routes/_authenticated/_shell/business/comic-detail/comic-detail-type";
import {
  shortWorkflowRecordUserId,
  workflowRecordUserIds,
} from "@/routes/_authenticated/_shell/business/comic-detail/workflow-record";

type Args = {
  records: ChapterWorkflowRecord[];
  assignments: AssignmentInfo[];
  onResolveUser: ComicDetailModalProps["onResolveWorkflowRecordUser"];
};

export function useWorkflowRecordUsers({
  records,
  assignments,
  onResolveUser,
}: Args): (userId: string) => string {
  const [resolvedUsers, setResolvedUsers] = useState<Map<string, UserInfo>>(() => new Map());
  const resolvedUsersRef = useRef(resolvedUsers);
  const pendingUserIdsRef = useRef(new Set<string>());
  const failedUserIdsRef = useRef(new Set<string>());

  const assignmentUsers = useMemo(() => {
    const users = new Map<string, UserInfo>();
    for (const assignment of assignments) {
      if (assignment.user) users.set(assignment.userId, assignment.user);
    }
    return users;
  }, [assignments]);

  useEffect(() => {
    const userIds = new Set(records.flatMap((record) => workflowRecordUserIds(record)));
    const missingUserIds = [...userIds].filter(
      (userId) =>
        !assignmentUsers.has(userId) &&
        !resolvedUsersRef.current.has(userId) &&
        !pendingUserIdsRef.current.has(userId) &&
        !failedUserIdsRef.current.has(userId),
    );

    for (const userId of missingUserIds) {
      pendingUserIdsRef.current.add(userId);
      void onResolveUser(userId)
        .then((result) => {
          if (!result.success) {
            failedUserIdsRef.current.add(userId);
            console.error("[ComicDetailModal] 解析 workflow record 用户失败:", result.error);
            return;
          }

          setResolvedUsers((previous) => {
            const next = new Map(previous);
            next.set(userId, result.data);
            resolvedUsersRef.current = next;
            return next;
          });
        })
        .catch((error: unknown) => {
          failedUserIdsRef.current.add(userId);
          console.error("[ComicDetailModal] 解析 workflow record 用户异常:", error);
        })
        .finally(() => {
          pendingUserIdsRef.current.delete(userId);
        });
    }
  }, [assignmentUsers, onResolveUser, records]);

  return useCallback(
    (userId: string) => {
      const user = assignmentUsers.get(userId) ?? resolvedUsers.get(userId);
      return user?.name.trim() ?? shortWorkflowRecordUserId(userId);
    },
    [assignmentUsers, resolvedUsers],
  );
}
