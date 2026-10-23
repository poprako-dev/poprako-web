import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { WorkspaceCommentsController } from "./workspace-comments-controller";

type WorkspaceComments = ReturnType<WorkspaceCommentsController["getSnapshot"]> & {
  handleSendComment: WorkspaceCommentsController["send"];
  refreshComments: WorkspaceCommentsController["refresh"];
};

export function useWorkspaceComments(selectedTeamId: string | null): WorkspaceComments {
  const client = useApiClient();
  const { generation, userInfo } = useReadySession();
  const showToast = useToastStore((state) => state.showToast);
  const scope = useMemo(
    () => ({ generation, client, teamId: selectedTeamId, user: userInfo, showToast }),
    [generation, client, selectedTeamId, userInfo, showToast],
  );
  const controller = useMemo(() => new WorkspaceCommentsController(scope), [scope]);
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    controller.start();
    return () => {
      controller.dispose();
    };
  }, [controller]);
  return { ...snapshot, handleSendComment: controller.send, refreshComments: controller.refresh };
}
