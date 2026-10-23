import { createModuleResource } from "@/shared/utility/module-resource";
import type * as ComicDetail from "./ComicDetailModal";

export const comicDetailModule = createModuleResource(() => import("./ComicDetailModal"));

export function preloadComicDetail(): Promise<typeof ComicDetail> {
  return comicDetailModule.load();
}

export function warmComicDetail(): void {
  void preloadComicDetail().catch((error: unknown) => {
    console.warn("[ComicDetail] 详情代码预热失败:", error);
  });
}
