export type ComicDetailMode = "translator" | "reviewer";
export type WorkbenchReturnRoute = "/workspace" | "/comic-playground";
export type WorkbenchDestination = {
  returnTo: WorkbenchReturnRoute;
  comicId: string;
  chapterId: string;
  pageId: string;
  readOnly: boolean;
  mode: ComicDetailMode;
};
export type WorkbenchSearch = {
  returnTo?: WorkbenchReturnRoute;
  comicId?: string;
  chapterId?: string;
  readOnly?: string;
};
export function parseWorkbenchSearch(search: Record<string, unknown>): WorkbenchSearch {
  const returnTo = search["returnTo"];
  const comicId = search["comicId"];
  const chapterId = search["chapterId"];
  const readOnly = search["readOnly"];
  return {
    ...(returnTo === "/workspace" || returnTo === "/comic-playground" ? { returnTo } : {}),
    ...(typeof comicId === "string" && comicId.trim() !== "" ? { comicId } : {}),
    ...(typeof chapterId === "string" && chapterId.trim() !== "" ? { chapterId } : {}),
    ...(typeof readOnly === "string" ? { readOnly } : {}),
  };
}
export function workbenchReturnDestination(
  search: WorkbenchSearch,
  mode: ComicDetailMode,
):
  | {
      to: WorkbenchReturnRoute;
      search: { comicId: string; chapterId: string; detailMode: ComicDetailMode };
    }
  | undefined {
  const { returnTo, comicId, chapterId } = search;
  if (!returnTo || !comicId?.trim() || !chapterId?.trim()) return undefined;
  return { to: returnTo, search: { comicId, chapterId, detailMode: mode } };
}
export function isComicDetailMode(value: unknown): value is ComicDetailMode {
  return value === "translator" || value === "reviewer";
}
const sessionModes = new Map<string, ComicDetailMode>();
export function readComicDetailMode(userId: string): ComicDetailMode {
  try {
    const value = localStorage.getItem("comic-detail:mode:" + userId);
    return isComicDetailMode(value) ? value : "translator";
  } catch {
    return sessionModes.get(userId) ?? "translator";
  }
}
export function saveComicDetailMode(userId: string, mode: ComicDetailMode): void {
  sessionModes.set(userId, mode);
  try {
    localStorage.setItem("comic-detail:mode:" + userId, mode);
  } catch {
    /* Keep the selection for this session when persistent storage is unavailable. */
  }
}
