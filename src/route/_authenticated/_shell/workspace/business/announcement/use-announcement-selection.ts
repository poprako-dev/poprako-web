import { useState, type Dispatch, type SetStateAction } from "react";
import type { AnnouncementInfo } from "./announcement";

export type AnnouncementDraft = { title: string; content: string };

export type AnnouncementSelection = {
  selected: AnnouncementInfo | null;
  setSelected: Dispatch<SetStateAction<AnnouncementInfo | null>>;
  showCreate: boolean;
  setShowCreate: Dispatch<SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  draft: AnnouncementDraft;
  setDraft: Dispatch<SetStateAction<AnnouncementDraft>>;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: Dispatch<SetStateAction<boolean>>;
  handleOpenDetail: (announcement: AnnouncementInfo) => void;
  handleCloseDetail: () => void;
  handleStartEditing: () => void;
};

export function useAnnouncementSelection(): AnnouncementSelection {
  const [selected, setSelected] = useState<AnnouncementInfo | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<AnnouncementDraft>({ title: "", content: "" });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
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
    startAnnouncementEditing(selected, setDraft, setIsEditing);
  };
  return {
    selected,
    setSelected,
    showCreate,
    setShowCreate,
    isEditing,
    setIsEditing,
    draft,
    setDraft,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    handleOpenDetail,
    handleCloseDetail,
    handleStartEditing,
  };
}

function startAnnouncementEditing(
  selected: AnnouncementInfo | null,
  setDraft: Dispatch<SetStateAction<AnnouncementDraft>>,
  setIsEditing: Dispatch<SetStateAction<boolean>>,
): void {
  if (!selected) return;
  setDraft({ title: selected.title, content: selected.content });
  setIsEditing(true);
}
