import type { JSX } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { AnnouncementCreatorModal } from "./AnnouncementCreatorModal";
import { AnnouncementListBody } from "./announcement/AnnouncementListBody";
import { AnnouncementDetailDrawer } from "./announcement/AnnouncementDetailDrawer";
import { AnnouncementDetailPanel } from "./announcement/AnnouncementDetailPanel";
import { useAnnouncement } from "./announcement/use-announcement";

type Props = {
  teamId: string;
  teamName: string;
  isAdmin: boolean;
};

export function AnnouncementTable({ teamId, teamName, isAdmin }: Props): JSX.Element {
  const announcement = useAnnouncement({ teamId });
  return (
    <div className="mb-4">
      <AnnouncementHeader isAdmin={isAdmin} onCreate={announcement.setShowCreate} />
      <AnnouncementListBody
        announcements={announcement.announcements}
        loading={announcement.loading}
        onOpen={announcement.handleOpenDetail}
      />
      {announcement.selected && (
        <AnnouncementDetailDrawer
          isDeleteConfirmOpen={announcement.isDeleteConfirmOpen}
          isDeleting={announcement.isDeleting}
          onClose={announcement.handleCloseDetail}
          onCancelDelete={() => {
            announcement.setIsDeleteConfirmOpen(false);
          }}
          onConfirmDelete={() => {
            void announcement.handleDelete();
          }}
        >
          <AnnouncementDetailPanel
            announcement={announcement.selected}
            isAdmin={isAdmin}
            isEditing={announcement.isEditing}
            setIsEditing={announcement.setIsEditing}
            draft={announcement.draft}
            setDraft={announcement.setDraft}
            isSaving={announcement.isSaving}
            canPublish={announcement.canPublish}
            onRequestDelete={() => {
              announcement.setIsDeleteConfirmOpen(true);
            }}
            onStartEditing={announcement.handleStartEditing}
            onUpdate={() => {
              void announcement.handleUpdate();
            }}
          />
        </AnnouncementDetailDrawer>
      )}
      {announcement.showCreate && (
        <AnnouncementCreatorModal
          teamName={teamName}
          onSubmit={announcement.handleSubmit}
          onClose={() => {
            announcement.setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function AnnouncementHeader({
  isAdmin,
  onCreate,
}: {
  isAdmin: boolean;
  onCreate: (show: boolean) => void;
}): JSX.Element {
  return (
    <div className={clsx("flex items-center justify-between", "mb-2 px-0.5")}>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-surface-slate-300 shrink-0" />
        <span className="text-sm font-semibold text-text-muted-cool tracking-tight">当前公告</span>
      </div>
      <div className="flex-1 mx-2 h-0.5 bg-surface-slate-200" />
      {isAdmin && (
        <button
          type="button"
          onClick={() => {
            onCreate(true);
          }}
          className={clsx(
            "inline-flex items-center gap-1 px-2 py-1",
            "hover:text-ink-slate-700 bg-surface-slate-50 hover:bg-surface-green-100",
            "transition-colors duration-150 focus:outline-none",
            "rounded-sm",
          )}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
