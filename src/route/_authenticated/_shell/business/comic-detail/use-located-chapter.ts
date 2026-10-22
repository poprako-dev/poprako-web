import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "./comic-detail-type";

type Args = {
  comicId: string;
  initialChapterId?: string | null | undefined;
  onLoadChapter: DetailContract["onLoadChapter"];
  setLocated: (chapter: ChapterInfo | null) => void;
  setSelectedChapterId: (chapterId: string) => void;
  showToast: (message: string, type: ToastType) => void;
};

async function locateChapter(
  args: Args,
  isCurrent: () => boolean,
  select: boolean,
): Promise<ChapterInfo | null> {
  if (!args.initialChapterId || !isCurrent()) return null;
  if (select) {
    args.setLocated(null);
    args.setSelectedChapterId(args.initialChapterId);
  }
  try {
    const result = await args.onLoadChapter(args.initialChapterId);
    if (!isCurrent()) return null;
    if (!result.success) {
      showLocalApiFailure(result, args.showToast, "加载章节失败");
      return null;
    }
    if (result.data.id !== args.initialChapterId || result.data.comicId !== args.comicId) {
      args.showToast("章节不属于当前漫画", "error");
      return null;
    }
    args.setLocated(result.data);
    return result.data;
  } catch (error) {
    if (isCurrent()) showLocalCaughtError(error, args.showToast, "加载章节失败");
    return null;
  }
}

export function useLocatedChapter(args: Args): () => Promise<ChapterInfo | null> {
  const { comicId, initialChapterId, onLoadChapter, setLocated, setSelectedChapterId, showToast } =
    args;
  const owner = useMemo(
    () => ({
      comicId,
      initialChapterId,
      onLoadChapter,
      setLocated,
      setSelectedChapterId,
      showToast,
    }),
    [comicId, initialChapterId, onLoadChapter, setLocated, setSelectedChapterId, showToast],
  );
  const currentOwnerRef = useRef<Args | null>(null);
  useEffect(() => {
    currentOwnerRef.current = owner;
    void locateChapter(owner, () => currentOwnerRef.current === owner, true);
    return () => {
      currentOwnerRef.current = null;
    };
  }, [owner]);
  return useCallback(
    () => locateChapter(owner, () => currentOwnerRef.current === owner, false),
    [owner],
  );
}
