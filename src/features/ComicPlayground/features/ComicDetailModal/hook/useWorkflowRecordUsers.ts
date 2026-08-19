import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssignmentInfo } from "@/types/assignment";
import type { ChapterWorkflowRecord } from "@/types/chapterWorkflowRecord";
import type { UserInfo } from "@/types/user";
import type { ComicDetailModalProps } from "../types";
import {
  shortWorkflowRecordUserId,
  workflowRecordUserIds,
} from "../workflowRecord";

type Args = {
  records: ChapterWorkflowRecord[];
  assignments: AssignmentInfo[];
  onResolveUser: ComicDetailModalProps["onResolveWorkflowRecordUser"];
};

export function useWorkflowRecordUsers({
  records,
  assignments,
  onResolveUser,
}: Args) {
  const [resolvedUsers, setResolvedUsers] = useState<Map<string, UserInfo>>(
    () => new Map(),
  );
  const resolvedUsersRef = useRef(resolvedUsers);
  const pendingUserIdsRef = useRef(new Set<string>());
  const failedUserIdsRef = useRef(new Set<string>());

  const assignmentUsers = useMemo(() => {
    const users = new Map<string, UserInfo>();
    assignments.forEach((assignment) => {
      if (assignment.user) users.set(assignment.userId, assignment.user);
    });
    return users;
  }, [assignments]);

  useEffect(() => {
    const userIds = new Set(records.flatMap(workflowRecordUserIds));
    const missingUserIds = Array.from(userIds).filter(
      (userId) =>
        !assignmentUsers.has(userId) &&
        !resolvedUsersRef.current.has(userId) &&
        !pendingUserIdsRef.current.has(userId) &&
        !failedUserIdsRef.current.has(userId),
    );

    missingUserIds.forEach((userId) => {
      pendingUserIdsRef.current.add(userId);
      void onResolveUser(userId)
        .then((result) => {
          if (!result.success) {
            failedUserIdsRef.current.add(userId);
            console.error(
              "[ComicDetailModal] 解析 workflow record 用户失败:",
              result.error,
            );
            return;
          }

          setResolvedUsers((previous) => {
            const next = new Map(previous);
            next.set(userId, result.data);
            resolvedUsersRef.current = next;
            return next;
          });
        })
        .catch((error) => {
          failedUserIdsRef.current.add(userId);
          console.error(
            "[ComicDetailModal] 解析 workflow record 用户异常:",
            error,
          );
        })
        .finally(() => {
          pendingUserIdsRef.current.delete(userId);
        });
    });
  }, [assignmentUsers, onResolveUser, records]);

  return useCallback(
    (userId: string) => {
      const user = assignmentUsers.get(userId) ?? resolvedUsers.get(userId);
      return user?.name.trim() || shortWorkflowRecordUserId(userId);
    },
    [assignmentUsers, resolvedUsers],
  );
}
