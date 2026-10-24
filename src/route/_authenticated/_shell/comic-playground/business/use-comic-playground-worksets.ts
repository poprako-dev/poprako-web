import { type Dispatch, type SetStateAction, useCallback, useMemo } from "react";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { Result } from "@/shared/utility/result";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import { createWorkset, deleteWorkset } from "./workset/workset-request";
import type { CreateWorksetArgs } from "./workset/workset-input";
import {
  isWorksetScopeCurrent,
  useWorksetResource,
  type WorksetOwner,
} from "./use-workset-resource";

type ShowToast = (message: string, type: ToastType) => void;
type Args = { teamId: string | null; showToast: ShowToast };

type WorksetState = {
  worksets: WorksetInfo[];
  activeWorksetId: string;
  setActiveWorksetId: Dispatch<SetStateAction<string>>;
  activeWorkset: WorksetInfo | undefined;
  loadWorksets: () => Promise<void>;
  handleDeleteWorkset: (worksetId: string) => Promise<Result<void>>;
  handleCreateWorkset: (args: CreateWorksetArgs) => Promise<Result<string>>;
};

async function removeTeamWorkset(
  scope: WorksetOwner,
  worksetId: string,
  showToast: ShowToast,
): Promise<Result<void>> {
  if (!isWorksetScopeCurrent(scope)) return { success: false, error: "会话已失效" };
  const result = await deleteWorkset(scope.client, worksetId);
  if (!isWorksetScopeCurrent(scope)) return { success: false, error: "会话已失效" };
  if (!result.success) {
    console.error("[ComicPlayground] 删除作品集失败:", result.error);
    showLocalApiFailure(result, showToast);
    return result;
  }
  showToast("作品集已删除", "success");
  return result;
}

async function createTeamWorkset(
  scope: WorksetOwner,
  args: CreateWorksetArgs,
  showToast: ShowToast,
): Promise<Result<string>> {
  if (!isWorksetScopeCurrent(scope)) return { success: false, error: "会话已失效" };
  const result = await createWorkset(scope.client, args);
  if (!isWorksetScopeCurrent(scope)) return { success: false, error: "会话已失效" };
  if (!result.success) {
    console.error("[ComicPlayground] 创建作品集失败:", result.error);
    showLocalApiFailure(result, showToast);
  }
  return result;
}

export function useComicPlaygroundWorksets({ teamId, showToast }: Args): WorksetState {
  const { scope, worksets, activeWorksetId, setActiveWorksetId, loadWorksets } = useWorksetResource(
    { teamId, showToast },
  );
  const handleDeleteWorkset = useCallback(
    (worksetId: string) => removeTeamWorkset(scope, worksetId, showToast),
    [scope, showToast],
  );
  const handleCreateWorkset = useCallback(
    (args: CreateWorksetArgs) => createTeamWorkset(scope, args, showToast),
    [scope, showToast],
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
