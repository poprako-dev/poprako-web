import { useCallback, useMemo } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";
import {
  archiveComic,
  deleteComic,
  updateComic,
} from "@/route/_authenticated/business/comic/comic-request";
import { updateChapter } from "@/route/_authenticated/business/chapter/chapter-request";
import { createDetailActions } from "./use-detail-actions";
import { findComicMember, listComicMembers } from "./detail-request";
import type { DetailComicInfo, AssignableMemberArgs } from "./detail-request";
import type { Result } from "@/shared/utility/result";
import type { DetailContract } from "./comic-detail-type";

type Args = {
  comic: DetailComicInfo;
  onChanged: () => void;
  onClose: () => void;
};
/** The detail owns transport, identity and mutation invalidation. Hosts own navigation only. */
export function useDetailResource({
  comic,
  onChanged,
  onClose,
}: Args): ReturnType<typeof createDetailActions> &
  Pick<
    Required<DetailContract>,
    | "currentUserId"
    | "activeMember"
    | "onLoadAssignableMembers"
    | "onUpdateComic"
    | "onUpdateChapter"
    | "onDeleteComic"
    | "onArchiveComic"
  > {
  const client = useApiClient();
  const session = useReadySession();
  const operations = useMemo(() => createDetailActions(client), [client]);
  const onLoadAssignableMembers = useAssignableMemberLoader(client, comic);
  const onUpdateComic = useComicUpdater(client, comic.id, onChanged);
  const onUpdateChapter = useChapterUpdater(client, onChanged);
  const { onDeleteComic, onArchiveComic } = useComicRemovers(client, onChanged, onClose);
  return {
    ...operations,
    currentUserId: session.userInfo.id,
    activeMember: findComicMember(comic, session.memberInfos),
    onLoadAssignableMembers,
    onUpdateComic,
    onUpdateChapter,
    onDeleteComic,
    onArchiveComic,
  };
}

function useAssignableMemberLoader(
  client: ReturnType<typeof useApiClient>,
  comic: DetailComicInfo,
): NonNullable<DetailContract["onLoadAssignableMembers"]> {
  return useCallback(
    (_chapterId: string, args: AssignableMemberArgs) => listComicMembers(client, comic, args),
    [client, comic],
  );
}

function useComicUpdater(
  client: ReturnType<typeof useApiClient>,
  comicId: string,
  onChanged: () => void,
): NonNullable<DetailContract["onUpdateComic"]> {
  return useCallback(
    async (
      args: Parameters<NonNullable<DetailContract["onUpdateComic"]>>[0],
    ): Promise<Result<void>> => {
      const result = await updateComic(client, comicId, args);
      if (result.success) onChanged();
      return result;
    },
    [client, comicId, onChanged],
  );
}

function useChapterUpdater(
  client: ReturnType<typeof useApiClient>,
  onChanged: () => void,
): NonNullable<DetailContract["onUpdateChapter"]> {
  return useCallback(
    async (id: string, subtitle?: string): Promise<Result<void>> => {
      const result = await updateChapter(client, id, { subtitle });
      if (result.success) onChanged();
      return result;
    },
    [client, onChanged],
  );
}

function useComicRemovers(
  client: ReturnType<typeof useApiClient>,
  onChanged: () => void,
  onClose: () => void,
): Pick<Required<DetailContract>, "onDeleteComic" | "onArchiveComic"> {
  const removeComic = useCallback(
    async (id: string, archive: boolean): Promise<Result<void>> => {
      const result = await (archive ? archiveComic(client, id) : deleteComic(client, id));
      if (result.success) {
        onClose();
        onChanged();
      }
      return result;
    },
    [client, onClose, onChanged],
  );
  return {
    onDeleteComic: useCallback((id: string) => removeComic(id, false), [removeComic]),
    onArchiveComic: useCallback((id: string) => removeComic(id, true), [removeComic]),
  };
}
