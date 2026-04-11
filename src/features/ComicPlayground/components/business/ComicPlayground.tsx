import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast";
import ComicList from "@/features/ComcList/components/business/ComicList";
import ComicCreatorModal from "./ComicCreatorModal";
import WorksetCreatorModal from "./WorksetCreatorModal";
import { listWorksets, createWorkset, deleteWorkset } from "../../api/workset";
import { listComics, createComic } from "../../api/comic";
import { listChapters } from "../../api/chapter";
import type { WorksetInfo } from "@/types/workset";
import type { ComicInfo, ChapterInfo } from "@/types";
import type { Result } from "@/types/utils/result";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";
import type { CreateWorksetArgs } from "../../types/workset";
import type { CreateComicArgs } from "../../types/comic";

export default function ComicPlayground() {
  const loginState = useAppStore((s) => s.loginState);
  const teamId = loginState?.memberInfos[0]?.teamId;
  const { showToast } = useToastStore();

  const [worksets, setWorksets] = useState<WorksetInfo[]>([]);
  const [activeWorksetId, setActiveWorksetId] = useState<string>("");

  const [activeFuzzyTitle, setActiveFuzzyTitle] = useState<string>("");
  const [activeUploadStatus, setActiveUploadStatus] =
    useState<BinaryFilter>("unset");
  const [activeTranslateStatus, setActiveTranslateStatus] =
    useState<TripleFilter>("unset");
  const [activeProofreadStatus, setActiveProofreadStatus] =
    useState<TripleFilter>("unset");
  const [activeTypesetStatus, setActiveTypesetStatus] =
    useState<TripleFilter>("unset");
  const [activeReviewStatus, setActiveReviewStatus] =
    useState<BinaryFilter>("unset");
  const [activePublishStatus, setActivePublishStatus] =
    useState<BinaryFilter>("unset");

  const [showComicCreatorModal, setShowComicCreatorModal] = useState(false);
  const [showWorksetCreatorModal, setShowWorksetCreatorModal] = useState(false);

  const loadWorksets = useCallback(async () => {
    if (!teamId) return;
    const result = await listWorksets({ teamId, offset: 0, limit: 100 });
    if (!result.success) {
      console.error("[ComicPlayground] 加载作品集失败:", result.error);
      showToast(result.error, "error");
      return;
    }
    setWorksets(result.data);
    setActiveWorksetId((prev) => prev || result.data[0]?.id || "");
  }, [teamId, showToast]);

  useEffect(() => {
    loadWorksets();
  }, [loadWorksets]);

  const handleLoadComics = useCallback(
    async (offset: number, limit: number): Promise<ComicInfo[] | string> => {
      if (!activeWorksetId) return [];
      const result = await listComics({
        worksetId: activeWorksetId,
        fuzzyTitle: activeFuzzyTitle || undefined,
        uploadStatus:
          activeUploadStatus !== "unset" ? activeUploadStatus : undefined,
        translateStatus:
          activeTranslateStatus !== "unset" ? activeTranslateStatus : undefined,
        proofreadStatus:
          activeProofreadStatus !== "unset" ? activeProofreadStatus : undefined,
        typesetStatus:
          activeTypesetStatus !== "unset" ? activeTypesetStatus : undefined,
        reviewStatus:
          activeReviewStatus !== "unset" ? activeReviewStatus : undefined,
        publishStatus:
          activePublishStatus !== "unset" ? activePublishStatus : undefined,
        offset,
        limit,
      });
      if (!result.success) return result.error;
      return result.data;
    },
    [
      activeWorksetId,
      activeFuzzyTitle,
      activeUploadStatus,
      activeTranslateStatus,
      activeProofreadStatus,
      activeTypesetStatus,
      activeReviewStatus,
      activePublishStatus,
    ],
  );

  const handleLoadLatestChapter = useCallback(
    async (comicInfo: ComicInfo): Promise<Result<ChapterInfo | null>> => {
      const result = await listChapters({
        comicId: comicInfo.id,
        offset: 0,
        limit: 1,
      });
      if (!result.success) return result;
      return { success: true, data: result.data[0] ?? null };
    },
    [],
  );

  const handleDeleteWorkset = async (worksetId: string) => {
    const result = await deleteWorkset(worksetId);
    if (!result.success) {
      console.error("[ComicPlayground] 删除作品集失败:", result.error);
      showToast(result.error, "error");
      return;
    }
    await loadWorksets();
  };

  const handleCreateWorkset = async (
    args: CreateWorksetArgs,
  ): Promise<Result<string>> => {
    const result = await createWorkset(args);
    if (!result.success) {
      console.error("[ComicPlayground] 创建作品集失败:", result.error);
      showToast(result.error, "error");
    } else {
      await loadWorksets();
    }
    return result;
  };

  const handleCreateComic = async (
    args: CreateComicArgs,
  ): Promise<Result<string>> => {
    const result = await createComic(args);
    if (!result.success) {
      console.error("[ComicPlayground] 创建漫画失败:", result.error);
      showToast(result.error, "error");
    }
    return result;
  };

  const activeWorkset = worksets.find((w) => w.id === activeWorksetId);

  return (
    <>
      <ComicList
        mode="translator"
        worksets={worksets}
        activeWorksetId={activeWorksetId}
        onChangeWorkset={setActiveWorksetId}
        onCreateWorkset={() => setShowWorksetCreatorModal(true)}
        onDeleteWorkset={handleDeleteWorkset}
        onLoadComics={handleLoadComics}
        onLoadLatestChapter={handleLoadLatestChapter}
        onCreateComic={() => setShowComicCreatorModal(true)}
        onChangeFuzzyTitle={setActiveFuzzyTitle}
        activeFuzzyTitle={activeFuzzyTitle}
        activeUploadStatus={activeUploadStatus}
        activeTranslateStatus={activeTranslateStatus}
        activeProofreadStatus={activeProofreadStatus}
        activeTypesetStatus={activeTypesetStatus}
        activeReviewStatus={activeReviewStatus}
        activePublishStatus={activePublishStatus}
        onChangeUploadStatus={setActiveUploadStatus}
        onChangeTranslateStatus={setActiveTranslateStatus}
        onChangeProofreadStatus={setActiveProofreadStatus}
        onChangeTypesetStatus={setActiveTypesetStatus}
        onChangeReviewStatus={setActiveReviewStatus}
        onChangePublishStatus={setActivePublishStatus}
      />
      {showComicCreatorModal && activeWorkset && (
        <ComicCreatorModal
          currWorkset={activeWorkset}
          onCreateComic={handleCreateComic}
          onClose={() => setShowComicCreatorModal(false)}
        />
      )}
      {showWorksetCreatorModal && teamId && (
        <WorksetCreatorModal
          teamId={teamId}
          onCreateWorkset={handleCreateWorkset}
          onClose={() => setShowWorksetCreatorModal(false)}
        />
      )}
    </>
  );
}
