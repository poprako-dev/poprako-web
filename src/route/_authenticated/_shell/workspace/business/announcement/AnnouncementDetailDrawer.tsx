import type { ReactNode, JSX } from "react";
import clsx from "clsx";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { AnnouncementDetailHeader } from "./AnnouncementDetailHeader";

type Props = {
  children: ReactNode;
  isDeleteConfirmOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export function AnnouncementDetailDrawer({
  children,
  isDeleteConfirmOpen,
  isDeleting,
  onClose,
  onCancelDelete,
  onConfirmDelete,
}: Props): JSX.Element {
  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex justify-end",
        "bg-surface-black/5 backdrop-blur-[1px]",
      )}
    >
      <button type="button" aria-label="关闭公告详情" className="fixed inset-0" onClick={onClose} />
      <div
        className={clsx(
          "relative w-full max-w-xs bg-surface-stone-50 h-full",
          "border-l border-line-slate-200 p-5",
          "flex flex-col shadow-sm",
          "animate-in slide-in-from-right duration-200",
        )}
      >
        <AnnouncementDetailHeader onClose={onClose} />
        {children}
      </div>
      {isDeleteConfirmOpen && (
        <ConfirmDialog
          title="删除公告"
          description="删除后无法恢复，确定删除该公告吗？"
          confirmLabel="删除"
          loading={isDeleting}
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      )}
    </div>
  );
}
