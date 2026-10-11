import { useCallback, useState } from "react";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/api/announcement";
import type { Result } from "@/shared/utility/result";
import type { AnnouncementInfo } from "./announcement";
import type { AnnouncementDraft, AnnouncementSelection } from "./use-announcement-selection";
import type { AnnouncementListState } from "./use-announcement-list";
import { useApiClient } from "@/route/business/api-context";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

type SubmitAction = (args: AnnouncementDraft) => Promise<Result<string>>;
type AsyncAction = () => Promise<void>;

export function useAnnouncementSubmit(teamId: string, load: () => Promise<void>): SubmitAction {
  const client = useApiClient();
  const { showToast } = useToastStore();
  return useCallback(
    async (args: AnnouncementDraft): Promise<Result<string>> => {
      const result = await createAnnouncement(client, { teamId, ...args });
      if (!result.success) {
        console.error("[AnnouncementTable] 发布公告失败:", result.error);
        showLocalApiFailure(result, showToast, "发布公告失败");
        return result;
      }
      await load();
      return result;
    },
    [client, load, showToast, teamId],
  );
}

export function useAnnouncementUpdate(
  selection: AnnouncementSelection,
  list: AnnouncementListState,
): { isSaving: boolean; handleUpdate: AsyncAction } {
  const client = useApiClient();
  const { showToast } = useToastStore();
  const [isSaving, setIsSaving] = useState(false);
  const handleUpdate = useCallback(async (): Promise<void> => {
    const selected = selection.selected;
    if (!selected) return;
    const title = selection.draft.title.trim();
    const content = selection.draft.content.trim();
    if (!title || !content) return;
    setIsSaving(true);
    const result = await updateAnnouncement(client, selected.id, { title, content });
    setIsSaving(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 修改公告失败:", result.error);
      showLocalApiFailure(result, showToast, "修改公告失败");
      return;
    }
    const updated = { ...selected, title, content };
    selection.setSelected(updated);
    list.setAnnouncements((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    selection.setIsEditing(false);
    await list.load();
  }, [client, list, selection, showToast]);
  return { isSaving, handleUpdate };
}

export function useAnnouncementDelete(input: {
  selected: AnnouncementInfo | null;
  closeDetail: () => void;
  load: () => Promise<void>;
}): { isDeleting: boolean; handleDelete: AsyncAction } {
  const client = useApiClient();
  const { showToast } = useToastStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = useCallback(async (): Promise<void> => {
    const selected = input.selected;
    if (!selected) return;
    setIsDeleting(true);
    const result = await deleteAnnouncement(client, selected.id);
    setIsDeleting(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 删除公告失败:", result.error);
      showLocalApiFailure(result, showToast, "删除公告失败");
      return;
    }
    input.closeDetail();
    await input.load();
  }, [client, input, showToast]);
  return { isDeleting, handleDelete };
}
