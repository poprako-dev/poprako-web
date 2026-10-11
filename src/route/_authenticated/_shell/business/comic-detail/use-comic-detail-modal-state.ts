import { readComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import { useCallback, useRef, useState } from "react";
import type { ComicDetailModalProps } from "./ComicDetailModal";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";

import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useDetailResource } from "./use-detail-resource";

import type { ComicDetailView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailContent";

import { useComicDetailModalActions } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-modal-actions";
import type { PendingConfirmAction } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import { useComicDetailAssignments } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-assignments";
import { useComicDetailChapters } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters";
import { useComicDetailExport } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-export";
import { useComicDetailPages } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-pages";
import { useComicDetailWorkflowRecords } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records";
import { useWorkflowRecordUsers } from "./use-workflow-record-users";

type Props = ComicDetailModalProps;
type Resource = ReturnType<typeof useDetailResource>;
type Chapters = ReturnType<typeof useComicDetailChapters>;
type Assignments = ReturnType<typeof useComicDetailAssignments>;
type Pages = ReturnType<typeof useComicDetailPages>;
type Workflow = ReturnType<typeof useModalWorkflow>;
type Toast = ReturnType<typeof useToastStore.getState>["showToast"];

type Presentation = {
  currentMode: ComicDetailMode;
  localMode: ComicDetailMode;
  setLocalMode: React.Dispatch<React.SetStateAction<ComicDetailMode>>;
  activeView: ComicDetailView;
  setActiveView: React.Dispatch<React.SetStateAction<ComicDetailView>>;
  pendingConfirmAction: PendingConfirmAction;
  setPendingConfirmAction: React.Dispatch<React.SetStateAction<PendingConfirmAction>>;
  isArchivingComic: boolean;
  setIsArchivingComic: React.Dispatch<React.SetStateAction<boolean>>;
  isDeletingComic: boolean;
  setIsDeletingComic: React.Dispatch<React.SetStateAction<boolean>>;
  showComicModifier: boolean;
  setShowComicModifier: React.Dispatch<React.SetStateAction<boolean>>;
  chapterToModify: ChapterInfo | null;
  setChapterToModify: React.Dispatch<React.SetStateAction<ChapterInfo | null>>;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
};

export type ComicDetailModalState = {
  resource: Resource;
  presentation: Presentation;
  chapters: Chapters;
  workflow: Workflow;
  assignments: Assignments;
  pages: Pages;
  exportState: ReturnType<typeof useComicDetailExport>;
  actions: ReturnType<typeof useComicDetailModalActions>;
  showToast: Toast;
  getWorkflowRecordUserLabel: ReturnType<typeof useWorkflowRecordUsers>;
};

function useModalPresentation(currentUserId: string, mode: Props["mode"]): Presentation {
  const [localMode, setLocalMode] = useState(() => readComicDetailMode(currentUserId));
  const currentMode = mode ?? localMode;
  const [activeView, setActiveView] = useState<ComicDetailView>("pages");
  const [pendingConfirmAction, setPendingConfirmAction] = useState<PendingConfirmAction>(null);
  const [isArchivingComic, setIsArchivingComic] = useState(false);
  const [isDeletingComic, setIsDeletingComic] = useState(false);
  const [showComicModifier, setShowComicModifier] = useState(false);
  const [chapterToModify, setChapterToModify] = useState<ChapterInfo | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  return {
    localMode,
    setLocalMode,
    currentMode,
    activeView,
    setActiveView,
    pendingConfirmAction,
    setPendingConfirmAction,
    isArchivingComic,
    setIsArchivingComic,
    isDeletingComic,
    setIsDeletingComic,
    showComicModifier,
    setShowComicModifier,
    chapterToModify,
    setChapterToModify,
    coverInputRef,
  };
}

type ModalWorkflow = {
  state: ReturnType<typeof useComicDetailWorkflowRecords>["state"];
  loadMore: () => Promise<void>;
  changed: () => void;
};

function useModalWorkflow(
  resource: Resource,
  presentation: Presentation,
  chapters: Chapters,
): ModalWorkflow {
  const { selectedChapterId } = chapters;
  const { activeView } = presentation;
  const { onLoadWorkflowRecords } = resource;
  const {
    state: workflowRecordState,
    refreshLatest: refreshWorkflowRecords,
    loadMore: loadMoreWorkflowRecords,
  } = useComicDetailWorkflowRecords({
    chapterId: selectedChapterId,
    enabled: activeView === "workflow",
    onLoadWorkflowRecords,
  });

  const handleWorkflowRecordsChanged = useCallback(() => {
    if (activeView === "workflow") void refreshWorkflowRecords();
  }, [activeView, refreshWorkflowRecords]);

  return {
    state: workflowRecordState,
    loadMore: loadMoreWorkflowRecords,
    changed: handleWorkflowRecordsChanged,
  };
}

function useModalAssignments(
  props: Props,
  resource: Resource,
  chapters: Chapters,
  workflow: Workflow,
  showToast: Toast,
): Assignments {
  const { selectedChapterId, isSelectedChapterAvailable } = chapters;
  const {
    currentUserId,
    activeMember,
    onLoadAssignments,
    onAddAssignment,
    onRemoveAssignment,
    onJoinChapterRole,
  } = resource;
  const pinnedChapterAssignments = props.comicInfo.pinnedChapterAssignments;
  const handleWorkflowRecordsChanged = workflow.changed;
  const assignmentState = useComicDetailAssignments({
    selectedChapterId,
    isSelectedChapterAvailable,
    currentUserId,
    activeMember,
    pinnedChapterId: props.pinnedChapter?.id,
    pinnedChapterAssignments,
    onLoadAssignments,
    onAddAssignment,
    onRemoveAssignment,
    onJoinChapterRole,
    onWorkflowRecordsChanged: handleWorkflowRecordsChanged,
    showToast,
  });

  return assignmentState;
}

function useModalPages(
  props: Props,
  resource: Resource,
  chapters: Chapters,
  presentation: Presentation,
  showToast: Toast,
): Pages {
  const { comicInfo } = props;
  const { selectedChapterId, isSelectedChapterAvailable, reloadLoadedChapters } = chapters;
  const { currentMode } = presentation;
  const { onLoadPages, onLoadChapters, onDeleteChapterPages } = resource;
  const pageState = useComicDetailPages({
    chapterId: selectedChapterId,
    comicId: comicInfo.id,
    isSelectedChapterAvailable: isSelectedChapterAvailable && currentMode === "translator",
    onLoadPages,
    onLoadChapters,
    onDeleteChapterPages,
    reloadLoadedChapters,
    showToast,
  });

  return pageState;
}

function useModalExport(
  props: Props,
  resource: Resource,
  chapters: Chapters,
  assignmentState: Assignments,
  pageState: Pages,
  workflow: Workflow,
  showToast: Toast,
): ReturnType<typeof useComicDetailExport> {
  const { comicInfo } = props;
  const { selectedChapterId, selectedChapter, reloadLoadedChapters } = chapters;
  const { assignments, canUploadRawPages } = assignmentState;
  const { pages, reloadCurrentPages } = pageState;
  const { activeMember, onExportChapter, onImportChapter } = resource;
  const handleWorkflowRecordsChanged = workflow.changed;
  const exportState = useComicDetailExport({
    comicId: comicInfo.id,
    comicTitle: comicInfo.title,
    comicAuthor: comicInfo.author,
    comicIndex: comicInfo.index,
    comicCoverThumbnailUrl: comicInfo.coverThumbnailUrl,
    isCoverUploaded: comicInfo.isCoverUploaded,
    selectedChapterId,
    selectedChapter,
    pages,
    assignments,
    activeMember,
    canUploadRawPages,
    onExportChapter,
    onImportChapter,
    reloadCurrentPages,
    reloadLoadedChapters: async () => {
      await reloadLoadedChapters();
    },
    onWorkflowRecordsChanged: handleWorkflowRecordsChanged,
    showToast,
  });

  return exportState;
}

function useModalActions(
  props: Props,
  resource: Resource,
  chapters: Chapters,
  presentation: Presentation,
  workflow: Workflow,
  showToast: Toast,
): ReturnType<typeof useComicDetailModalActions> {
  const { comicInfo } = props;
  const { selectedChapterId, selectedChapter, setChapters } = chapters;
  const { onTransiteWorkflow, onDeleteComic, onArchiveComic } = resource;
  const { setIsDeletingComic, setIsArchivingComic } = presentation;
  const handleWorkflowRecordsChanged = workflow.changed;
  return useComicDetailModalActions({
    comicId: comicInfo.id,
    selectedChapterId,
    selectedChapter,
    onTransiteWorkflow,
    onDeleteComic,
    onArchiveComic,
    setChapters,
    setIsDeletingComic,
    setIsArchivingComic,
    handleWorkflowRecordsChanged,
    showToast,
  });
}

function useModalWorkflowUsers(
  resource: Resource,
  assignments: Assignments,
  workflow: Workflow,
): ReturnType<typeof useWorkflowRecordUsers> {
  return useWorkflowRecordUsers({
    records: workflow.state.records,
    assignments: assignments.assignments,
    onResolveUser: resource.onResolveWorkflowRecordUser,
  });
}

export function useComicDetailModalState(props: Props): ComicDetailModalState {
  const resource = useDetailResource({
    comic: props.comicInfo,
    onChanged: props.onChanged,
    onClose: props.onClose,
  });
  const { showToast } = useToastStore();
  const presentation = useModalPresentation(resource.currentUserId, props.mode);
  const chapters = useComicDetailChapters({
    comicId: props.comicInfo.id,
    pinnedChapter: props.pinnedChapter,
    initialChapterId: props.initialChapterId,
    onLoadChapters: resource.onLoadChapters,
    showToast,
  });
  const workflow = useModalWorkflow(resource, presentation, chapters);
  const assignments = useModalAssignments(props, resource, chapters, workflow, showToast);
  const getWorkflowRecordUserLabel = useModalWorkflowUsers(resource, assignments, workflow);
  const pages = useModalPages(props, resource, chapters, presentation, showToast);
  const exportState = useModalExport(
    props,
    resource,
    chapters,
    assignments,
    pages,
    workflow,
    showToast,
  );
  const actions = useModalActions(props, resource, chapters, presentation, workflow, showToast);

  return {
    resource,
    presentation,
    chapters,
    workflow,
    assignments,
    pages,
    exportState,
    actions,
    showToast,
    getWorkflowRecordUserLabel,
  };
}
