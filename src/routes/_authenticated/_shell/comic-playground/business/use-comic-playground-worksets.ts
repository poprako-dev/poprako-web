import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { showLocalApiFailure } from "@/routes/business/request";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { Result } from "@/shared/utility/result";
import type { WorksetInfo } from "@/routes/_authenticated/business/workset/workset";
import {
  createWorkset,
  deleteWorkset,
  listWorksets,
} from "@/routes/_authenticated/_shell/comic-playground/business/workset/workset-request";
import type { CreateWorksetArgs } from "@/routes/_authenticated/_shell/comic-playground/business/workset/workset-input";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  teamId: string | null;
  showToast: ShowToast;
};

export function useComicPlaygroundWorksets({ teamId, showToast }: Args): {
  worksets: WorksetInfo[];
  activeWorksetId: string;
  setActiveWorksetId: Dispatch<SetStateAction<string>>;
  activeWorkset: WorksetInfo | undefined;
  loadWorksets: () => Promise<void>;
  handleDeleteWorkset: (worksetId: string) => Promise<void>;
  handleCreateWorkset: (args: CreateWorksetArgs) => Promise<Result<string>>;
} {
  const [worksets, setWorksets] = useState<WorksetInfo[]>([]);
  const [activeWorksetId, setActiveWorksetId] = useState<string>("");

  const loadWorksets = useCallback(async () => {
    if (!teamId) {
      setWorksets([]);
      setActiveWorksetId("");
      return;
    }

    const result = await listWorksets({ teamId, offset: 0, limit: 20 });
    if (!result.success) {
      console.error("[ComicPlayground] 加载作品集失败:", result.error);
      showLocalApiFailure(result, showToast);
      return;
    }

    setWorksets(result.data);
    setActiveWorksetId((prev) =>
      result.data.some((workset) => workset.id === prev) ? prev : (result.data[0]?.id ?? ""),
    );
  }, [showToast, teamId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWorksets();
  }, [loadWorksets]);

  const handleDeleteWorkset = useCallback(
    async (worksetId: string) => {
      const result = await deleteWorkset(worksetId);
      if (!result.success) {
        console.error("[ComicPlayground] 删除作品集失败:", result.error);
        showLocalApiFailure(result, showToast);
        return;
      }

      await loadWorksets();
    },
    [loadWorksets, showToast],
  );

  const handleCreateWorkset = useCallback(
    async (args: CreateWorksetArgs): Promise<Result<string>> => {
      const result = await createWorkset(args);
      if (result.success) {
        await loadWorksets();
      } else {
        console.error("[ComicPlayground] 创建作品集失败:", result.error);
        showLocalApiFailure(result, showToast);
      }

      return result;
    },
    [loadWorksets, showToast],
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
