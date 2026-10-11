import type { Dispatch, SetStateAction } from "react";
import type { Result } from "@/shared/utility/result";
import type { AnnouncementInfo } from "./announcement";
import { useAnnouncementList } from "./use-announcement-list";
import {
  useAnnouncementDelete,
  useAnnouncementSubmit,
  useAnnouncementUpdate,
} from "./use-announcement-actions";
import { useAnnouncementSelection, type AnnouncementDraft } from "./use-announcement-selection";

export type { AnnouncementDraft } from "./use-announcement-selection";

type Args = { teamId: string };

type AnnouncementState = {
  announcements: AnnouncementInfo[];
  loading: boolean;
  selected: AnnouncementInfo | null;
  showCreate: boolean;
  setShowCreate: Dispatch<SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  draft: AnnouncementDraft;
  setDraft: Dispatch<SetStateAction<AnnouncementDraft>>;
  isSaving: boolean;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: Dispatch<SetStateAction<boolean>>;
  isDeleting: boolean;
  canPublish: boolean;
  handleSubmit: (args: AnnouncementDraft) => Promise<Result<string>>;
  handleOpenDetail: (announcement: AnnouncementInfo) => void;
  handleCloseDetail: () => void;
  handleStartEditing: () => void;
  handleUpdate: () => Promise<void>;
  handleDelete: () => Promise<void>;
};

export function useAnnouncement({ teamId }: Args): AnnouncementState {
  const list = useAnnouncementList(teamId);
  const selection = useAnnouncementSelection();
  const submit = useAnnouncementSubmit(teamId, list.load);
  const update = useAnnouncementUpdate(selection, list);
  const deletion = useAnnouncementDelete({
    selected: selection.selected,
    closeDetail: selection.handleCloseDetail,
    load: list.load,
  });
  const isDraftDirty =
    selection.selected !== null &&
    (selection.draft.title !== selection.selected.title ||
      selection.draft.content !== selection.selected.content);
  const isDraftValid =
    selection.draft.title.trim().length > 0 && selection.draft.content.trim().length > 0;

  return {
    announcements: list.announcements,
    loading: list.loading,
    selected: selection.selected,
    showCreate: selection.showCreate,
    setShowCreate: selection.setShowCreate,
    isEditing: selection.isEditing,
    setIsEditing: selection.setIsEditing,
    draft: selection.draft,
    setDraft: selection.setDraft,
    isSaving: update.isSaving,
    isDeleteConfirmOpen: selection.isDeleteConfirmOpen,
    setIsDeleteConfirmOpen: selection.setIsDeleteConfirmOpen,
    isDeleting: deletion.isDeleting,
    canPublish: isDraftDirty && isDraftValid && !update.isSaving,
    handleSubmit: submit,
    handleOpenDetail: selection.handleOpenDetail,
    handleCloseDetail: selection.handleCloseDetail,
    handleStartEditing: selection.handleStartEditing,
    handleUpdate: update.handleUpdate,
    handleDelete: deletion.handleDelete,
  };
}
