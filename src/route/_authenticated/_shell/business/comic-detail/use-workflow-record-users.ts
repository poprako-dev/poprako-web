import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ChapterWorkflowRecord } from "@/route/_authenticated/business/chapter/chapter-workflow-record";
import type { UserInfo } from "@/route/business/identity/user";
import type { RefObject, Dispatch, SetStateAction } from "react";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import {
  shortWorkflowRecordUserId,
  workflowRecordUserIds,
} from "@/route/_authenticated/_shell/business/comic-detail/workflow-record";

type Args = {
  records: ChapterWorkflowRecord[];
  assignments: AssignmentInfo[];
  onResolveUser: DetailContract["onResolveWorkflowRecordUser"];
};

type UserResolution = {
  onResolveUser: DetailContract["onResolveWorkflowRecordUser"];
  pendingUserIdsRef: RefObject<Set<string>>;
  failedUserIdsRef: RefObject<Set<string>>;
  resolvedUsersRef: RefObject<Map<string, UserInfo>>;
  setResolvedUsers: Dispatch<SetStateAction<Map<string, UserInfo>>>;
};

async function resolveWorkflowRecordUser(
  userId: string,
  resolution: UserResolution,
): Promise<void> {
  const { onResolveUser, pendingUserIdsRef, failedUserIdsRef, resolvedUsersRef, setResolvedUsers } =
    resolution;
  pendingUserIdsRef.current.add(userId);
  try {
    const result = await onResolveUser(userId);
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
  } catch (error: unknown) {
    failedUserIdsRef.current.add(userId);
    console.error("[ComicDetailModal] 解析 workflow record 用户异常:", error);
  } finally {
    pendingUserIdsRef.current.delete(userId);
  }
}

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
      void resolveWorkflowRecordUser(userId, {
        onResolveUser,
        pendingUserIdsRef,
        failedUserIdsRef,
        resolvedUsersRef,
        setResolvedUsers,
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
