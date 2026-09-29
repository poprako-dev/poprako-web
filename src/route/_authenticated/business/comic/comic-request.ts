import type { ApiClient } from "@/api/client";
import * as comicApi from "@/api/comic/comic-api";
import type { ComicInclude, CreateComicArgs, ListComicArgs, UpdateComicArgs } from "./comic-input";
import type { ComicInfo } from "./comic";
import type { Result } from "@/shared/utility/result";
import type { AllocImageArgs, ImageUploadSlot } from "@/route/business/identity/image";
import { toAssignmentInfo, toChapterInfo, toComicInfo } from "../content-adapter";

export async function listComics(
  client: ApiClient,
  args: ListComicArgs,
): Promise<Result<ComicInfo[]>> {
  const result = await comicApi.listComics(client, args.worksetId, args);
  if (!result.success) return result;
  const { comics, pinnedChapters, pinnedChapterAssignments } = result.data;
  return {
    success: true,
    data: comics.map((comic, index) => {
      const pinned = pinnedChapters[index];
      return {
        ...toComicInfo(comic),
        pinnedChapter: pinned ? toChapterInfo(pinned) : undefined,
        pinnedChapterAssignments: (pinnedChapterAssignments[index] ?? []).map(toAssignmentInfo),
      };
    }),
  };
}
export async function getComic(
  client: ApiClient,
  id: string,
  includes: ComicInclude[] = [],
): Promise<Result<ComicInfo>> {
  const result = await comicApi.getComic(client, id, includes);
  return result.success ? { success: true, data: toComicInfo(result.data) } : result;
}
export async function createComic(
  client: ApiClient,
  args: CreateComicArgs,
): Promise<Result<string>> {
  const { firstChapterTitle, ...input } = args;
  const result = await comicApi.createComic(client, {
    ...input,
    firstChapterSubtitle: firstChapterTitle,
  });
  return result.success ? { success: true, data: result.data.id } : result;
}
export function updateComic(
  client: ApiClient,
  id: string,
  args: UpdateComicArgs,
): Promise<Result<undefined>> {
  return comicApi.updateComic(client, id, args);
}
export function deleteComic(client: ApiClient, id: string): Promise<Result<undefined>> {
  return comicApi.deleteComic(client, id);
}
export async function archiveComic(client: ApiClient, id: string): Promise<Result<undefined>> {
  const result = await comicApi.archiveComic(client, id);
  return result.success ? { success: true, data: undefined } : result;
}
export async function allocCoverUpload(
  client: ApiClient,
  comicId: string,
  args: AllocImageArgs,
): Promise<Result<ImageUploadSlot | null>> {
  const result = await comicApi.allocComicCoverUpload(client, comicId, args);
  return result.success ? { success: true, data: result.data.slot } : result;
}
export function markCoverUploaded(
  client: ApiClient,
  comicId: string,
  imageVersion: number,
): Promise<Result<void>> {
  return comicApi.markComicCoverUploaded(client, comicId, imageVersion);
}
