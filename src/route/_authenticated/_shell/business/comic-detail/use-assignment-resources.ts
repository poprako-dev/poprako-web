import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "./comic-detail-type";
import { AssignmentResources } from "./assignment-resources";

const EMPTY_ASSIGNMENTS: AssignmentInfo[] = [];
type Args = {
  selectedChapterId: string | null;
  isSelectedChapterAvailable: boolean;
  pinnedChapterId?: string | null | undefined;
  pinnedChapterAssignments?: AssignmentInfo[] | undefined;
  onLoadAssignments: DetailContract["onLoadAssignments"];
  showToast: (message: string, type: ToastType) => void;
  scope: string;
};

export function useAssignmentResources(args: Args): {
  assignments: AssignmentInfo[];
  pinnedAssignments: AssignmentInfo[];
  setAssignments: Dispatch<SetStateAction<AssignmentInfo[]>>;
  isAssignmentsLoading: boolean;
  reloadAssignments: () => Promise<AssignmentInfo[] | null>;
} {
  const { onLoadAssignments, showToast, scope } = args;
  const { resources } = useMemo(
    () => ({ scope, resources: new AssignmentResources(onLoadAssignments, showToast) }),
    [onLoadAssignments, showToast, scope],
  );
  const snapshot = useSyncExternalStore(resources.subscribe, resources.getSnapshot);
  const selectedId = args.isSelectedChapterAvailable ? args.selectedChapterId : null;
  useLoadAssignments(resources, { ...args, selectedChapterId: selectedId });
  const setAssignments = useCallback(
    (update: SetStateAction<AssignmentInfo[]>) => {
      if (selectedId) resources.update(selectedId, update);
    },
    [resources, selectedId],
  );
  const reloadAssignments = useCallback(
    () => (selectedId ? resources.load(selectedId, true) : Promise.resolve(null)),
    [resources, selectedId],
  );
  return {
    assignments: selectedId
      ? (snapshot.get(selectedId)?.assignments ?? EMPTY_ASSIGNMENTS)
      : EMPTY_ASSIGNMENTS,
    pinnedAssignments: args.pinnedChapterId
      ? (snapshot.get(args.pinnedChapterId)?.assignments ?? EMPTY_ASSIGNMENTS)
      : EMPTY_ASSIGNMENTS,
    setAssignments,
    isAssignmentsLoading: Boolean(selectedId && snapshot.get(selectedId)?.loading),
    reloadAssignments,
  };
}

function useLoadAssignments(resources: AssignmentResources, args: Args): void {
  const { selectedChapterId, pinnedChapterId, pinnedChapterAssignments } = args;
  useEffect(() => {
    resources.activate();
    return () => {
      resources.dispose();
    };
  }, [resources]);
  useEffect(() => {
    const ids = [selectedChapterId, pinnedChapterId].filter((id): id is string => Boolean(id));
    resources.retain(ids);
    if (pinnedChapterId && pinnedChapterAssignments !== undefined)
      resources.seed(pinnedChapterId, pinnedChapterAssignments);
    for (const id of new Set(ids)) void resources.load(id);
  }, [resources, selectedChapterId, pinnedChapterId, pinnedChapterAssignments]);
}
