import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/api/announcement";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Result } from "@/shared/utility/result";
import type { AnnouncementInfo } from "@/route/_authenticated/_shell/workspace/business/announcement/announcement";
import { useApiClient } from "@/route/business/api-context";
import { listAnnouncements } from "@/route/_authenticated/_shell/workspace/business/announcement/announcement-request";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

type Draft = { title: string; content: string };

type Args = { teamId: string };

type AnnouncementState = {
  announcements: AnnouncementInfo[];
  loading: boolean;
  selected: AnnouncementInfo | null;
  showCreate: boolean;
  setShowCreate: Dispatch<SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  isSaving: boolean;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: Dispatch<SetStateAction<boolean>>;
  isDeleting: boolean;
  canPublish: boolean;
  handleSubmit: (args: Draft) => Promise<Result<string>>;
  handleOpenDetail: (announcement: AnnouncementInfo) => void;
  handleCloseDetail: () => void;
  handleStartEditing: () => void;
  handleUpdate: () => Promise<void>;
  handleDelete: () => Promise<void>;
};

export function useAnnouncement({ teamId }: Args): AnnouncementState {
  const client = useApiClient();
  const { showToast } = useToastStore();
  const [announcements, setAnnouncements] = useState<AnnouncementInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnnouncementInfo | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const requestSequenceRef = useRef(0);

  const load = useCallback(async (): Promise<void> => {
    const sequence = ++requestSequenceRef.current;
    setLoading(true);
    const result = await listAnnouncements(client, { teamId, offset: 0, limit: 3 });
    if (sequence !== requestSequenceRef.current) return;
    setLoading(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 加载公告失败:", result.error);
      showLocalApiFailure(result, showToast, "加载公告失败");
      return;
    }
    setAnnouncements(result.data.slice(0, 3));
  }, [client, showToast, teamId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleSubmit = useCallback(
    async (args: Draft) => {
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

  const handleOpenDetail = (announcement: AnnouncementInfo): void => {
    setSelected(announcement);
    setIsEditing(false);
    setIsDeleteConfirmOpen(false);
  };

  const handleCloseDetail = (): void => {
    setSelected(null);
    setIsEditing(false);
    setIsDeleteConfirmOpen(false);
  };

  const handleStartEditing = (): void => {
    if (!selected) return;
    setDraft({ title: selected.title, content: selected.content });
    setIsEditing(true);
  };

  const handleUpdate = async (): Promise<void> => {
    if (!selected) return;
    const title = draft.title.trim();
    const content = draft.content.trim();
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
    setSelected(updated);
    setAnnouncements((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setIsEditing(false);
    await load();
  };

  const handleDelete = async (): Promise<void> => {
    if (!selected) return;
    setIsDeleting(true);
    const result = await deleteAnnouncement(client, selected.id);
    setIsDeleting(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 删除公告失败:", result.error);
      showLocalApiFailure(result, showToast, "删除公告失败");
      return;
    }
    handleCloseDetail();
    await load();
  };

  const isDraftDirty =
    selected !== null && (draft.title !== selected.title || draft.content !== selected.content);
  const isDraftValid = draft.title.trim().length > 0 && draft.content.trim().length > 0;

  return {
    announcements,
    loading,
    selected,
    showCreate,
    setShowCreate,
    isEditing,
    setIsEditing,
    draft,
    setDraft,
    isSaving,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isDeleting,
    canPublish: isDraftDirty && isDraftValid && !isSaving,
    handleSubmit,
    handleOpenDetail,
    handleCloseDetail,
    handleStartEditing,
    handleUpdate,
    handleDelete,
  };
}
