import { useApiClient } from "@/route/business/api-context";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ApiClient } from "@/api/client";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { Result } from "@/shared/utility/result";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import {
  createWorkset,
  deleteWorkset,
  listWorksets,
} from "@/route/_authenticated/_shell/comic-playground/business/workset/workset-request";
import type { CreateWorksetArgs } from "@/route/_authenticated/_shell/comic-playground/business/workset/workset-input";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  teamId: string | null;
  showToast: ShowToast;
};

type WorksetState = {
  worksets: WorksetInfo[];
  activeWorksetId: string;
  setActiveWorksetId: Dispatch<SetStateAction<string>>;
  activeWorkset: WorksetInfo | undefined;
  loadWorksets: () => Promise<void>;
  handleDeleteWorkset: (worksetId: string) => Promise<void>;
  handleCreateWorkset: (args: CreateWorksetArgs) => Promise<Result<string>>;
};

async function loadTeamWorksets(
  client: ApiClient,
  teamId: string | null,
  showToast: ShowToast,
  setWorksets: Dispatch<SetStateAction<WorksetInfo[]>>,
  setActiveWorksetId: Dispatch<SetStateAction<string>>,
): Promise<void> {
  if (!teamId) {
    setWorksets([]);
    setActiveWorksetId("");
    return;
  }
  const result = await listWorksets(client, { teamId, offset: 0, limit: 20 });
  if (!result.success) {
    console.error("[ComicPlayground] 加载作品集失败:", result.error);
    showLocalApiFailure(result, showToast);
    return;
  }
  setWorksets(result.data);
  setActiveWorksetId((previous) =>
    result.data.some((workset) => workset.id === previous) ? previous : (result.data[0]?.id ?? ""),
  );
}

async function removeTeamWorkset(
  client: ApiClient,
  worksetId: string,
  reload: () => Promise<void>,
  showToast: ShowToast,
): Promise<void> {
  const result = await deleteWorkset(client, worksetId);
  if (!result.success) {
    console.error("[ComicPlayground] 删除作品集失败:", result.error);
    showLocalApiFailure(result, showToast);
    return;
  }
  await reload();
}

async function createTeamWorkset(
  client: ApiClient,
  args: CreateWorksetArgs,
  reload: () => Promise<void>,
  showToast: ShowToast,
): Promise<Result<string>> {
  const result = await createWorkset(client, args);
  if (result.success) await reload();
  else {
    console.error("[ComicPlayground] 创建作品集失败:", result.error);
    showLocalApiFailure(result, showToast);
  }
  return result;
}

export function useComicPlaygroundWorksets({ teamId, showToast }: Args): WorksetState {
  const client = useApiClient();
  const [worksets, setWorksets] = useState<WorksetInfo[]>([]);
  const [activeWorksetId, setActiveWorksetId] = useState<string>("");

  const loadWorksets = useCallback(
    () => loadTeamWorksets(client, teamId, showToast, setWorksets, setActiveWorksetId),
    [client, showToast, teamId],
  );

  useEffect(() => {
    void loadWorksets();
  }, [loadWorksets]);

  const handleDeleteWorkset = useCallback(
    (worksetId: string) => removeTeamWorkset(client, worksetId, loadWorksets, showToast),
    [client, loadWorksets, showToast],
  );

  const handleCreateWorkset = useCallback(
    (args: CreateWorksetArgs) => createTeamWorkset(client, args, loadWorksets, showToast),
    [client, loadWorksets, showToast],
  );

  const activeWorkset = useMemo(
    () => worksets.find((workset) => workset.id === activeWorksetId),
    [activeWorksetId, worksets],
  );

  return {
    worksets,
    activeWorksetId,
    setActiveWorksetId,
    activeWorkset,
    loadWorksets,
    handleDeleteWorkset,
    handleCreateWorkset,
  };
}
