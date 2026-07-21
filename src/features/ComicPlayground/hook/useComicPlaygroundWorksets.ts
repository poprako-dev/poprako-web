import { useCallback, useEffect, useMemo, useState } from "react";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { Result } from "@/types/utils/result";
import type { WorksetInfo } from "@/types/workset";
import { createWorkset, deleteWorkset, listWorksets } from "../api/workset";
import type { CreateWorksetArgs } from "../types/workset";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  teamId: string | null;
  showToast: ShowToast;
};

export function useComicPlaygroundWorksets({ teamId, showToast }: Args) {
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
      showToast(result.error, "error");
      return;
    }

    setWorksets(result.data);
    setActiveWorksetId((prev) =>
      result.data.some((workset) => workset.id === prev)
        ? prev
        : result.data[0]?.id || "",
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
        showToast(result.error, "error");
        return;
      }

      await loadWorksets();
    },
    [loadWorksets, showToast],
  );

  const handleCreateWorkset = useCallback(
    async (args: CreateWorksetArgs): Promise<Result<string>> => {
      const result = await createWorkset(args);
      if (!result.success) {
        console.error("[ComicPlayground] 创建作品集失败:", result.error);
        showToast(result.error, "error");
      } else {
        await loadWorksets();
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
