import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { WorksetResource } from "./workset-resource";
import type { WorksetOwner, WorksetSnapshot } from "./workset-resource";

export { isWorksetScopeCurrent, type WorksetOwner } from "./workset-resource";

type Args = {
  teamId: string | null;
  showToast: (message: string, type: ToastType) => void;
};
type ResourceState = WorksetSnapshot & {
  scope: WorksetOwner;
  loadWorksets: () => Promise<void>;
  setActiveWorksetId: Dispatch<SetStateAction<string>>;
};

export function useWorksetResource({ teamId, showToast }: Args): ResourceState {
  const client = useApiClient();
  const generation = useAppStore((state) => state.generation);
  const resource = useMemo(
    () => new WorksetResource({ client, generation, teamId }),
    [client, generation, teamId],
  );
  const snapshot = useSyncExternalStore(resource.subscribe, resource.getSnapshot);
  const loadWorksets = useCallback(() => resource.load(showToast), [resource, showToast]);
  useEffect(() => {
    resource.activate(showToast);
    return () => {
      resource.dispose();
    };
  }, [resource, showToast]);
  return { ...snapshot, scope: resource.owner, loadWorksets, setActiveWorksetId: resource.select };
}
