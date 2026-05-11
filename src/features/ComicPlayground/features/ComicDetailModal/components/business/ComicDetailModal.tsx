import { useEffect, useRef, useState, type ChangeEvent } from "react";
import clsx from "clsx";
import {
  X,
  BookOpen,
  Hash,
  Languages,
  CheckSquare,
  CloudUpload,
  Image as ImageIcon,
  Download,
  Pencil,
  Eraser,
  Trash2,
} from "lucide-react";
import type {
  ListChapterArgs,
  WorkflowTransition,
  ChapterExport,
  ImportChapterFormat,
  ImportChapterResult,
} from "@/features/ComicPlayground/types/chapter";
import type {
  ChapterInfo,
  ComicInfo,
  PageInfo,
  UploadProgressCallbacks,
} from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { useAppStore } from "@/store/app";
import {
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import LazyImage from "./LazyImage";
import StatItem from "./StatItem";
import ActionButton from "./ActionButton";
import ChapterOption from "./ChapterOption";
import AssignmentFooter from "./AssignmentFooter";
import PageList from "@/features/PageList/components/business/PageList";
import ComicDetailModalLayout from "../../layout/ComicDetailModalLayout";
import MemberSelectorModal from "./MemberSelectorModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { MemberInfo } from "@/types/member";
import { hasRole, type Role } from "@/types/role";
import { useActiveTeam } from "@/hooks/useActiveTeam";

const ROLE_TITLE_LABEL: Record<Role, string> = {
  rawProvider: "图源",
  translator: "翻译",
  proofreader: "校对",
  typesetter: "嵌字",
  redrawer: "美工",
  reviewer: "审核",
  publisher: "发布",
  admin: "管理员",
};

type Props = {
  comicInfo: ComicInfo;
  pinnedChapter: ChapterInfo | null;
  initialChapterId?: string | null;
  onLoadChapters: (args: ListChapterArgs) => Promise<Result<ChapterInfo[]>>;
  onLoadAssignments: (chapterId: string) => Promise<Result<AssignmentInfo[]>>;
  onLoadPages: (chapterId: string) => Promise<Result<PageInfo[]>>;
  onTransiteWorkflow: (
    chapterId: string,
    transition: WorkflowTransition,
  ) => Promise<Result<void>>;
  onRemoveAssignment?: (
    chapterId: string,
    userId: string,
    role: Role,
  ) => Promise<Result<void>>;
  onLoadAssignableMembers?: (
    chapterId: string,
  ) => Promise<Result<MemberInfo[]>>;
  onAddAssignment?: (
    chapterId: string,
    userId: string,
    role: Role,
  ) => Promise<Result<void>>;
  onCreateChapter?: (args: {
    comicId: string;
    subtitle?: string;
  }) => Promise<Result<string>>;
  onDeleteChapter?: (chapterId: string) => Promise<Result<void>>;
  onNavigateToTranslator?: (chapterId: string, pageId: string) => void;
  currentUserId?: string | null;
  onAddPages?: (
    chapterId: string,
    files: File[],
    callbacks?: UploadProgressCallbacks,
  ) => Promise<void>;
  onDeleteChapterPages?: (chapterId: string) => Promise<Result<void>>;
  onReservePageUpload?: (args: {
    pageId: string;
    fileExtension: string;
  }) => Promise<Result<{ pageId: string; putUrl: string }>>;
  onJoinChapterRole?: (chapterId: string, role: Role) => Promise<Result<void>>;
  onImportChapter?: (args: {
    chapterId: string;
    content: string;
    format: ImportChapterFormat;
  }) => Promise<Result<ImportChapterResult>>;
  onExportChapter?: (chapterId: string) => Promise<Result<ChapterExport>>;
  onDeleteComic?: (comicId: string) => Promise<Result<void>>;
  onClose: () => void;
};

export default function ComicDetailModal({
  comicInfo,
  pinnedChapter,
  initialChapterId,
  onLoadChapters,
  onLoadAssignments,
  onLoadPages,
  onTransiteWorkflow,
  onRemoveAssignment,
  onLoadAssignableMembers,
  onAddAssignment,
  onCreateChapter,
  onDeleteChapter,
  onNavigateToTranslator,
  currentUserId,
  onAddPages,
  onDeleteChapterPages,
  onReservePageUpload,
  onJoinChapterRole,
  onImportChapter,
  onExportChapter,
  onDeleteComic,
  onClose,
}: Props) {
  const { showToast } = useToastStore();
  const accessToken = useAppStore((s) => s.accessToken);
  const { activeMember } = useActiveTeam();
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    initialChapterId ?? pinnedChapter?.id ?? null,
  );
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [assignableMembers, setAssignableMembers] = useState<MemberInfo[]>([]);
  const [isMemberSelectorLoading, setIsMemberSelectorLoading] = useState(false);
  const [memberSelectorRole, setMemberSelectorRole] = useState<Role | null>(
    null,
  );
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingChapterPages, setIsDeletingChapterPages] = useState(false);
  const [isDeletingComic, setIsDeletingComic] = useState(false);
  const [reuploadingPageIds, setReuploadingPageIds] = useState<
    Record<string, boolean>
  >({});
  const [uploadProgressByPageId, setUploadProgressByPageId] = useState<
    Record<string, number>
  >({});
  const [joiningRoles, setJoiningRoles] = useState<
    Partial<Record<Role, boolean>>
  >({});
  const [chaptersHasMore, setChaptersHasMore] = useState(true);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);
  const [canCreateChapter, setCanCreateChapter] = useState(false);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<
    "delete-pages" | "delete-comic" | null
  >(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const CHAPTERS_LIMIT = 20;

  const selectedChapter =
    chapters.find((c) => c.id === selectedChapterId) ??
    (pinnedChapter?.id === selectedChapterId ? pinnedChapter : undefined);
  const isSelectedChapterAvailable =
    selectedChapterId !== null &&
    (chapters.some((chapter) => chapter.id === selectedChapterId) ||
      pinnedChapter?.id === selectedChapterId);

  const currentAssignment = assignments.find(
    (item) => item.userId === currentUserId,
  );
  const canTranslateOrProofread =
    !!currentAssignment &&
    (hasRole(currentAssignment, "translator") ||
      hasRole(currentAssignment, "proofreader"));
  const canManageChapterAssignments =
    !!currentAssignment && hasRole(currentAssignment, "reviewer");
  const canUploadRawPages =
    !!currentAssignment && hasRole(currentAssignment, "rawProvider");
  const canDeleteChapterPages =
    canUploadRawPages &&
    pages.length > 0 &&
    !!selectedChapterId &&
    !!onDeleteChapterPages;
  const canUploadNewRawPages =
    canUploadRawPages &&
    pages.length === 0 &&
    !!selectedChapterId &&
    !!onAddPages;
  const canReuploadRawPages = canUploadRawPages && !!onReservePageUpload;
  const isTeamAdmin = activeMember !== null && hasRole(activeMember, "admin");
  const assignedUserIdsForSelectedRole =
    memberSelectorRole === null
      ? []
      : assignments
          .filter((assignment) => hasRole(assignment, memberSelectorRole))
          .map((assignment) => assignment.userId);

  useEffect(() => {
    if (isTeamAdmin) {
      setCanCreateChapter(true);
      return;
    }

    if (!pinnedChapter?.id || !currentUserId) {
      setCanCreateChapter(false);
      return;
    }

    let cancelled = false;

    onLoadAssignments(pinnedChapter.id)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载 pinned 章节分工失败:", res);
          if (!cancelled) {
            setCanCreateChapter(false);
          }
          return;
        }

        const pinnedAssignment = res.data.find(
          (assignment) => assignment.userId === currentUserId,
        );

        if (!cancelled) {
          setCanCreateChapter(
            !!pinnedAssignment && hasRole(pinnedAssignment, "reviewer"),
          );
        }
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载 pinned 章节分工异常:", err);
        if (!cancelled) {
          setCanCreateChapter(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, isTeamAdmin, onLoadAssignments, pinnedChapter?.id]);

  // Load initial chapters
  useEffect(() => {
    let cancelled = false;

    const loadInitialChapters = async () => {
      setIsChaptersLoading(true);

      try {
        let offset = 0;
        let hasMore = true;
        const loadedChapters: ChapterInfo[] = [];

        while (hasMore) {
          const res = await onLoadChapters({
            comicId: comicInfo.id,
            offset,
            limit: CHAPTERS_LIMIT,
          });

          if (!res.success) {
            console.error("[ComicDetailModal] 加载章节失败:", res);
            showToast("加载章节失败", "error");
            return;
          }

          loadedChapters.push(...res.data);
          hasMore = res.data.length === CHAPTERS_LIMIT;

          if (
            !initialChapterId ||
            loadedChapters.some((chapter) => chapter.id === initialChapterId) ||
            !hasMore
          ) {
            if (!cancelled) {
              setChapters(loadedChapters);
              setChaptersHasMore(hasMore);
              setSelectedChapterId(() => {
                if (
                  initialChapterId &&
                  loadedChapters.some(
                    (chapter) => chapter.id === initialChapterId,
                  )
                ) {
                  return initialChapterId;
                }
                if (
                  pinnedChapter?.id &&
                  loadedChapters.some(
                    (chapter) => chapter.id === pinnedChapter.id,
                  )
                ) {
                  return pinnedChapter.id;
                }
                return loadedChapters[0]?.id ?? null;
              });
            }
            return;
          }

          offset += res.data.length;
        }

        if (!cancelled) {
          setChapters(loadedChapters);
          setChaptersHasMore(false);
          setSelectedChapterId(loadedChapters[0]?.id ?? null);
        }
      } catch (err) {
        console.error("[ComicDetailModal] 加载章节异常:", err);
        showToast("加载章节失败", "error");
      } finally {
        if (!cancelled) {
          setIsChaptersLoading(false);
        }
      }
    };

    loadInitialChapters();

    return () => {
      cancelled = true;
    };
  }, [
    comicInfo.id,
    initialChapterId,
    onLoadChapters,
    pinnedChapter?.id,
    showToast,
  ]);

  const handleLoadMoreChapters = () => {
    if (isChaptersLoading || !chaptersHasMore) return;
    setIsChaptersLoading(true);
    onLoadChapters({
      comicId: comicInfo.id,
      offset: chapters.length,
      limit: CHAPTERS_LIMIT,
    })
      .then((res) => {
        if (!res.success) {
          showToast("加载更多章节失败", "error");
          return;
        }
        setChapters((prev) => [...prev, ...res.data]);
        setChaptersHasMore(res.data.length === CHAPTERS_LIMIT);
      })
      .catch(() => showToast("加载更多章节失败", "error"))
      .finally(() => setIsChaptersLoading(false));
  };

  // Load assignments when chapter changes
  useEffect(() => {
    if (!selectedChapterId || !isSelectedChapterAvailable) return;
    setAssignments([]);
    onLoadAssignments(selectedChapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载分工失败:", res);
          showToast("加载分工失败", "error");
          return;
        }
        setAssignments(res.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载分工异常:", err);
        showToast("加载分工失败", "error");
      });
  }, [
    isSelectedChapterAvailable,
    onLoadAssignments,
    selectedChapterId,
    showToast,
  ]);

  // Load pages when chapter changes
  useEffect(() => {
    if (!selectedChapterId || !isSelectedChapterAvailable) return;
    setPages([]);
    setUploadProgressByPageId({});
    onLoadPages(selectedChapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载页面失败:", res);
          showToast("加载页面失败", "error");
          return;
        }
        setPages(res.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载页面异常:", err);
        showToast("加载页面失败", "error");
      });
  }, [isSelectedChapterAvailable, onLoadPages, selectedChapterId, showToast]);

  const handleTransition = async (
    transition: WorkflowTransition,
  ): Promise<Result<void>> => {
    if (!selectedChapterId) return { success: false, error: "未选择章节" };
    const res = await onTransiteWorkflow(selectedChapterId, transition);
    if (!res.success) {
      console.error("[ComicDetailModal] 推进流程失败:", res);
      showToast("操作失败", "error");
    }
    return res;
  };

  const handleRemoveAssignment = (userId: string, role: Role) => {
    if (!selectedChapterId || !onRemoveAssignment) return;
    onRemoveAssignment(selectedChapterId, userId, role)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 移除角色失败:", res);
          showToast("移除角色失败", "error");
          return;
        }
        onLoadAssignments(selectedChapterId).then((refreshed) => {
          if (refreshed.success) {
            setAssignments(refreshed.data);
          }
        });
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 移除角色异常:", err);
        showToast("移除角色失败", "error");
      });
  };

  const handleOpenMemberSelector = (role: Role) => {
    if (!selectedChapterId || !onLoadAssignableMembers) return;
    setMemberSelectorRole(role);
    setIsMemberSelectorLoading(true);
    onLoadAssignableMembers(selectedChapterId)
      .then((result) => {
        if (!result.success) {
          showToast(result.error, "error");
          return;
        }
        setAssignableMembers(result.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载可分配成员异常:", err);
        showToast("加载成员失败", "error");
      })
      .finally(() => setIsMemberSelectorLoading(false));
  };

  const handleAddAssignment = async (userId: string) => {
    if (!selectedChapterId || !memberSelectorRole || !onAddAssignment) return;
    setIsAddingAssignment(true);
    const result = await onAddAssignment(
      selectedChapterId,
      userId,
      memberSelectorRole,
    );
    setIsAddingAssignment(false);

    if (!result.success) {
      showToast(result.error, "error");
      return;
    }

    const refreshedAssignments = await onLoadAssignments(selectedChapterId);
    if (refreshedAssignments.success) {
      setAssignments(refreshedAssignments.data);
    }
    setMemberSelectorRole(null);
  };

  const reloadCurrentPages = async () => {
    if (!selectedChapterId) return;
    const res = await onLoadPages(selectedChapterId);
    if (!res.success) {
      showToast(res.error, "error");
      return;
    }
    setPages(res.data);
    setUploadProgressByPageId({});
  };

  const reloadLoadedChapters = async () => {
    const res = await onLoadChapters({
      comicId: comicInfo.id,
      offset: 0,
      limit: Math.max(chapters.length, CHAPTERS_LIMIT),
    });

    if (!res.success) {
      console.error("[ComicDetailModal] 刷新章节失败:", res);
      showToast("刷新章节失败", "error");
      return;
    }

    setChapters(res.data);
  };

  const handleAddRawPages = async (files: File[]) => {
    if (!selectedChapterId || !onAddPages) return;

    const blobUrls: string[] = [];
    const tempPageIds = files.map(
      (_, index) =>
        `tmp-page-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    );
    const pendingPageIds = new Set<string>(tempPageIds);
    const startIndex = pages.length;

    const tempPages: PageInfo[] = tempPageIds.map((tempId, index) => ({
      id: tempId,
      chapterId: selectedChapterId,
      index: startIndex + index,
      imageUrl: "",
      isUploaded: false,
      creatorId: currentUserId ?? "",
      totalUnitCount: 0,
      translatedUnitCount: 0,
      proofreadUnitCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    setPages((prev) => [...prev, ...tempPages]);
    setUploadProgressByPageId((prev) => {
      const next = { ...prev };
      for (const tempId of tempPageIds) next[tempId] = 0;
      return next;
    });

    const callbacks: UploadProgressCallbacks = {
      onPagesReserved: (pendingPages) => {
        pendingPageIds.clear();
        for (let i = 0; i < pendingPages.length; i++) {
          pendingPageIds.add(pendingPages[i].pageId);
        }

        setPages((prev) => {
          const idMap = new Map<string, string>();
          for (let i = 0; i < pendingPages.length; i++) {
            const tempId = tempPageIds[i];
            const reservedPageId = pendingPages[i].pageId;
            if (tempId) idMap.set(tempId, reservedPageId);
          }

          return prev.map((page) => {
            const reservedPageId = idMap.get(page.id);
            if (!reservedPageId) return page;
            return { ...page, id: reservedPageId };
          });
        });

        setUploadProgressByPageId((prev) => {
          const next = { ...prev };
          for (let i = 0; i < pendingPages.length; i++) {
            const tempId = tempPageIds[i];
            const reservedPageId = pendingPages[i].pageId;
            if (!tempId) continue;
            next[reservedPageId] = next[tempId] ?? 0;
            delete next[tempId];
          }
          return next;
        });
      },
      onPageUploadProgress: (pageId, percent) => {
        setUploadProgressByPageId((prev) => ({ ...prev, [pageId]: percent }));
      },
      onPageUploaded: (pageId, file) => {
        const blobUrl = URL.createObjectURL(file);
        blobUrls.push(blobUrl);
        setUploadProgressByPageId((prev) => {
          if (!(pageId in prev)) return prev;
          const next = { ...prev };
          delete next[pageId];
          return next;
        });
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId ? { ...p, imageUrl: blobUrl, isUploaded: true } : p,
          ),
        );
      },
    };

    try {
      await onAddPages(selectedChapterId, files, callbacks);
      // Revoke blob URLs now that real URLs will replace them
      for (const url of blobUrls) URL.revokeObjectURL(url);
      setUploadProgressByPageId({});
      await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);
    } catch (err) {
      // Remove pending pages from this batch and revoke blob URLs
      for (const url of blobUrls) URL.revokeObjectURL(url);
      setPages((prev) => prev.filter((p) => !pendingPageIds.has(p.id)));
      setUploadProgressByPageId((prev) => {
        const next = { ...prev };
        for (const pageId of pendingPageIds) delete next[pageId];
        for (const tempId of tempPageIds) delete next[tempId];
        return next;
      });
      console.error("[ComicDetailModal] 上传页面失败:", err);
      showToast(err instanceof Error ? err.message : "上传页面失败", "error");
    }
  };

  const handleDeleteAllChapterPages = async () => {
    if (!selectedChapterId || !onDeleteChapterPages) return;

    setIsDeletingChapterPages(true);
    const res = await onDeleteChapterPages(selectedChapterId);
    setIsDeletingChapterPages(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 批量删除页面失败:", res);
      showToast(res.error, "error");
      return;
    }

    await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);
    showToast("页面已清空", "success");
  };

  const getFileExtension = (file: File): string | null => {
    const dotIndex = file.name.lastIndexOf(".");
    if (dotIndex < 0 || dotIndex === file.name.length - 1) return null;
    return file.name.slice(dotIndex + 1).toLowerCase();
  };

  const handleReuploadPage = async (pageId: string, file: File) => {
    if (!onReservePageUpload || reuploadingPageIds[pageId]) return;

    const fileExtension = getFileExtension(file);
    if (!fileExtension) {
      showToast("请选择带后缀的图片文件", "error");
      return;
    }

    setReuploadingPageIds((prev) => ({ ...prev, [pageId]: true }));
    setUploadProgressByPageId((prev) => ({ ...prev, [pageId]: 0 }));
    try {
      const reserveResult = await onReservePageUpload({
        pageId,
        fileExtension,
      });
      if (!reserveResult.success) {
        console.error("[ComicDetailModal] 重上传预留失败:", reserveResult);
        showToast(reserveResult.error, "error");
        return;
      }

      const uploadResult = await uploadToPresignedUrl(
        reserveResult.data.putUrl,
        file,
        (percent) => {
          setUploadProgressByPageId((prev) => ({ ...prev, [pageId]: percent }));
        },
      );
      if (!uploadResult.success) {
        console.error("[ComicDetailModal] 重上传文件失败:", uploadResult.error);
        showToast(uploadResult.error, "error");
        return;
      }

      const markResult = await updatePage(reserveResult.data.pageId, {
        isUploaded: true,
      });
      if (!markResult.success) {
        console.error(
          "[ComicDetailModal] 标记重上传状态失败:",
          markResult.error,
        );
        showToast(markResult.error, "error");
        return;
      }

      await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);
      showToast("重上传成功", "success");
    } catch (err) {
      console.error("[ComicDetailModal] 重上传异常:", err);
      showToast(err instanceof Error ? err.message : "重上传失败", "error");
    } finally {
      setReuploadingPageIds((prev) => ({ ...prev, [pageId]: false }));
      setUploadProgressByPageId((prev) => {
        if (!(pageId in prev)) return prev;
        const next = { ...prev };
        delete next[pageId];
        return next;
      });
    }
  };

  const isRoleAlreadyJoined = (role: Role) => {
    if (!currentAssignment) return false;
    if (role === "typesetter") {
      return (
        hasRole(currentAssignment, "typesetter") ||
        hasRole(currentAssignment, "redrawer")
      );
    }
    return hasRole(currentAssignment, role);
  };

  const canJoinRole = (role: Role) => {
    if (
      !activeMember ||
      !onJoinChapterRole ||
      !selectedChapterId ||
      !currentUserId
    ) {
      return false;
    }
    return hasRole(activeMember, role) && !isRoleAlreadyJoined(role);
  };

  const handleJoinRole = async (role: Role) => {
    if (!selectedChapterId || !onJoinChapterRole || joiningRoles[role]) return;

    setJoiningRoles((prev) => ({ ...prev, [role]: true }));
    try {
      const result = await onJoinChapterRole(selectedChapterId, role);
      if (!result.success) {
        console.error("[ComicDetailModal] 加入章节分工失败:", result);
        showToast(result.error, "error");
        return;
      }

      const refreshedAssignments = await onLoadAssignments(selectedChapterId);
      if (!refreshedAssignments.success) {
        console.error("[ComicDetailModal] 刷新分工失败:", refreshedAssignments);
        showToast(refreshedAssignments.error, "error");
        return;
      }

      setAssignments(refreshedAssignments.data);
      showToast("加入分工成功", "success");
    } catch (err) {
      console.error("[ComicDetailModal] 加入章节分工异常:", err);
      showToast(err instanceof Error ? err.message : "加入分工失败", "error");
    } finally {
      setJoiningRoles((prev) => ({ ...prev, [role]: false }));
    }
  };

  const handleDeleteCurrentComic = async () => {
    if (!onDeleteComic) return;

    setIsDeletingComic(true);
    const res = await onDeleteComic(comicInfo.id);
    setIsDeletingComic(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 删除漫画失败:", res);
      showToast(res.error, "error");
      return;
    }

    showToast("漫画删除成功", "success");
  };

  const handleOpenImportPicker = () => {
    if (!selectedChapterId || !onImportChapter || isImportingData) return;
    importFileInputRef.current?.click();
  };

  const detectImportFormat = (file: File): ImportChapterFormat | null => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".json")) return "json";
    if (name.endsWith(".txt")) return "lp";
    return null;
  };

  const handleImportFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = "";
    if (!selectedFile || !selectedChapterId || !onImportChapter) return;

    const format = detectImportFormat(selectedFile);
    if (!format) {
      showToast("仅支持 .json 或 .txt 文件", "error");
      return;
    }

    setIsImportingData(true);
    try {
      const content = await selectedFile.text();
      const result = await onImportChapter({
        chapterId: selectedChapterId,
        content,
        format,
      });

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      await Promise.all([
        reloadCurrentPages(),
        onLoadChapters({
          comicId: comicInfo.id,
          offset: 0,
          limit: CHAPTERS_LIMIT,
        }).then((res) => {
          if (res.success) {
            setChapters(res.data);
            return;
          }
          showToast(res.error, "error");
        }),
      ]);

      showToast(
        `导入成功：${result.data.importedPageCount} 页，${result.data.importedUnitCount} 单元`,
        "success",
      );
    } catch (err) {
      console.error("[ComicDetailModal] 导入章节数据异常:", err);
      showToast("导入失败", "error");
    } finally {
      setIsImportingData(false);
    }
  };

  const sanitizeFileName = (value: string) =>
    (value || "")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .trim()
      .slice(0, 120) || "chapter-export";

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("无法读取图片数据"));
      };
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.readAsDataURL(blob);
    });

  const fetchImageAsDataUrlWithRetry = async (
    imageUrl: string,
    maxAttempts = 3,
  ): Promise<string | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(imageUrl, {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        return await blobToDataUrl(blob);
      } catch (err) {
        if (attempt >= maxAttempts) {
          console.error(
            "[ComicDetailModal] 下载图片失败，已跳过:",
            imageUrl,
            err,
          );
          return null;
        }
        await wait(300 * attempt);
      }
    }
    return null;
  };

  const handleExportData = async () => {
    if (!selectedChapterId || !onExportChapter) return;

    setIsExportingData(true);
    try {
      const exportResult = await onExportChapter(selectedChapterId);
      if (!exportResult.success) {
        showToast(exportResult.error, "error");
        return;
      }

      const pagesWithImages = await Promise.all(
        exportResult.data.pages.map(async (page) => {
          if (!page.imageUrl) {
            return {
              ...page,
              imageDataUrl: null as string | null,
            };
          }

          const imageDataUrl = await fetchImageAsDataUrlWithRetry(
            page.imageUrl,
            3,
          );
          return {
            ...page,
            imageDataUrl,
          };
        }),
      );

      const skippedImages = pagesWithImages.filter(
        (page) => page.imageUrl && !page.imageDataUrl,
      ).length;

      const payload = {
        ...exportResult.data,
        exportedAt: new Date().toISOString(),
        skippedImageCount: skippedImages,
        pages: pagesWithImages,
      };

      const chapterLabel =
        selectedChapter?.index !== undefined
          ? `chapter-${selectedChapter.index}`
          : `chapter-${selectedChapterId}`;
      const fileName = sanitizeFileName(
        `${comicInfo.title}-${chapterLabel}-export.json`,
      );

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      if (skippedImages > 0) {
        showToast(`导出完成，${skippedImages} 张图片下载失败后已跳过`, "error");
        return;
      }
      showToast("导出成功", "success");
    } catch (err) {
      console.error("[ComicDetailModal] 导出章节数据异常:", err);
      showToast("导出失败", "error");
    } finally {
      setIsExportingData(false);
    }
  };

  const header = (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-black tracking-tight text-slate-800">
          {comicInfo.title}
        </h1>
        <ChapterOption
          comicInfo={comicInfo}
          chapters={chapters}
          selectedChapter={selectedChapter}
          hasMore={chaptersHasMore}
          isLoading={isChaptersLoading}
          onLoadMore={handleLoadMoreChapters}
          onSelect={setSelectedChapterId}
          onCreateChapter={
            onCreateChapter && canCreateChapter
              ? async (subtitle) => {
                  const res = await onCreateChapter({
                    comicId: comicInfo.id,
                    subtitle,
                  });
                  if (res.success) {
                    onLoadChapters({
                      comicId: comicInfo.id,
                      offset: 0,
                      limit: CHAPTERS_LIMIT,
                    }).then((r) => {
                      if (r.success) {
                        setChapters(r.data);
                        setSelectedChapterId(r.data[0]?.id ?? null);
                      }
                    });
                  }
                  return res;
                }
              : undefined
          }
          onDelete={
            onDeleteChapter
              ? async (id) => {
                  const res = await onDeleteChapter(id);
                  if (!res.success) {
                    showToast("删除失败", "error");
                    return;
                  }
                  if (selectedChapterId === id) {
                    const reloaded = await onLoadChapters({
                      comicId: comicInfo.id,
                      offset: 0,
                      limit: CHAPTERS_LIMIT,
                    });
                    if (reloaded.success) {
                      setChapters(reloaded.data);
                      setSelectedChapterId(reloaded.data[0]?.id ?? null);
                      return;
                    }
                    showToast("刷新章节失败", "error");
                  }
                  setChapters(chapters.filter((c) => c.id !== id));
                  if (selectedChapterId === id) setSelectedChapterId(null);
                }
              : undefined
          }
        />
      </div>
      <button
        onClick={onClose}
        className="text-slate-300 hover:text-slate-600 transition-colors p-1"
      >
        <X size={18} />
      </button>
    </>
  );

  const sidebar = (
    <>
      {/* Cover */}
      <div
        className={clsx(
          "w-28 mx-auto aspect-3/4 bg-slate-50 rounded-sm border border-slate-100",
          "flex items-center justify-center text-slate-200 mb-4 mt-2",
          "overflow-hidden shrink-0",
          "hover:border-slate-300 transition-colors group",
        )}
      >
        {comicInfo.coverUrl ? (
          <LazyImage
            src={comicInfo.coverUrl}
            alt={comicInfo.title}
            className="w-full h-full"
          />
        ) : (
          <ImageIcon
            size={24}
            className="group-hover:scale-110 transition-transform duration-300"
          />
        )}
      </div>

      {/* Stats */}
      <div className="space-y-0 mb-2 shrink-0">
        <StatItem
          icon={BookOpen}
          label="总页数"
          value={selectedChapter?.pageCount ?? "-"}
        />
        <StatItem
          icon={Hash}
          label="总单元数"
          value={selectedChapter?.totalUnitCount ?? "-"}
        />
        <StatItem
          icon={Languages}
          label="已翻译"
          value={selectedChapter?.translatedUnitCount ?? "-"}
        />
        <StatItem
          icon={CheckSquare}
          label="已校对"
          value={selectedChapter?.proofreadUnitCount ?? "-"}
        />
      </div>

      {/* No-chapter hint */}
      {!selectedChapter && (
        <p
          className={clsx(
            "text-[10px] sm:text-[9px] text-slate-300",
            "text-center leading-relaxed mb-2 shrink-0",
          )}
        >
          请从上方选择或创建一个章节
        </p>
      )}

      {/* Actions */}
      {selectedChapter && (
        <div className="flex flex-col gap-1 shrink-0">
          {canTranslateOrProofread && (
            <ActionButton
              icon={Pencil}
              title="开始翻校"
              onClick={
                selectedChapterId && onNavigateToTranslator
                  ? () => {
                      const firstPageId = pages[0]?.id;
                      if (!firstPageId) {
                        showToast("当前章节暂无页面", "error");
                        return;
                      }
                      onNavigateToTranslator(selectedChapterId, firstPageId);
                    }
                  : undefined
              }
            />
          )}
          {canDeleteChapterPages && (
            <ActionButton
              icon={Eraser}
              title="清空页面"
              onClick={() => setPendingConfirmAction("delete-pages")}
              disabled={isDeletingChapterPages}
            />
          )}
          {canUploadRawPages && (
            <ActionButton
              icon={CloudUpload}
              title="导入翻校"
              onClick={onImportChapter ? handleOpenImportPicker : undefined}
              disabled={isImportingData}
            />
          )}
          <ActionButton
            icon={Download}
            title="下载数据"
            onClick={onExportChapter ? handleExportData : undefined}
            disabled={isExportingData}
          />
          {isTeamAdmin && onDeleteComic && (
            <ActionButton
              icon={Trash2}
              title="删除漫画"
              onClick={() => setPendingConfirmAction("delete-comic")}
              disabled={isDeletingComic}
              danger
            />
          )}
          <input
            ref={importFileInputRef}
            type="file"
            accept=".json,.txt,application/json,text/plain"
            className="hidden"
            onChange={handleImportFileChange}
          />
        </div>
      )}
    </>
  );

  const pageGrid = (
    <PageList
      pages={pages}
      enableClick={canTranslateOrProofread}
      onClickPage={
        canTranslateOrProofread
          ? (pageId) => {
              if (!selectedChapterId || !onNavigateToTranslator) return;
              onNavigateToTranslator(selectedChapterId, pageId);
            }
          : undefined
      }
      onAddPages={canUploadNewRawPages ? handleAddRawPages : undefined}
      canReuploadPage={canReuploadRawPages ? () => true : undefined}
      isPageReuploading={(pageId) => !!reuploadingPageIds[pageId]}
      onReuploadPage={canReuploadRawPages ? handleReuploadPage : undefined}
      reuploadAccept="image/*"
      accept="image/*"
      emptyHintText=""
      uploadButtonText="点击此处以上传图片"
      uploadProgressByPageId={uploadProgressByPageId}
    />
  );

  const footer = (
    <AssignmentFooter
      selectedChapter={selectedChapter}
      assignments={assignments}
      onTransiteWorkflow={handleTransition}
      onRemoveAssignment={
        onRemoveAssignment ? handleRemoveAssignment : undefined
      }
      onAddAssignment={onAddAssignment ? handleOpenMemberSelector : undefined}
      onJoinRole={onJoinChapterRole ? handleJoinRole : undefined}
      canJoinRole={onJoinChapterRole ? canJoinRole : undefined}
      isRoleJoining={(role) => !!joiningRoles[role]}
      canOperateWorkflow={canManageChapterAssignments}
      canManageAssignments={canManageChapterAssignments}
    />
  );

  return (
    <>
      <ComicDetailModalLayout
        header={header}
        sidebar={sidebar}
        pageGrid={pageGrid}
        footer={footer}
      />
      {memberSelectorRole && (
        <MemberSelectorModal
          title={`添加${ROLE_TITLE_LABEL[memberSelectorRole]}成员`}
          members={assignableMembers}
          assignedUserIds={assignedUserIdsForSelectedRole}
          isSubmitting={isMemberSelectorLoading || isAddingAssignment}
          onSelectUser={handleAddAssignment}
          onClose={() => setMemberSelectorRole(null)}
        />
      )}
      {pendingConfirmAction === "delete-pages" && (
        <ConfirmDialog
          title="确认清空页面"
          description={`即将删除当前章节下的 ${pages.length} 页，删除后才能重新上传页面，此操作不可撤销。`}
          confirmLabel="清空"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleDeleteAllChapterPages();
          }}
          onCancel={() => setPendingConfirmAction(null)}
        />
      )}
      {pendingConfirmAction === "delete-comic" && (
        <ConfirmDialog
          title="确认删除漫画"
          description={`即将删除《${comicInfo.title}》，其章节与页面数据也会一并删除，此操作不可撤销。`}
          confirmLabel="删除"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleDeleteCurrentComic();
          }}
          onCancel={() => setPendingConfirmAction(null)}
        />
      )}
    </>
  );
}
